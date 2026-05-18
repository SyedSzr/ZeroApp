// ── STORE / CONTEXT ───────────────────────────────────────────────────────────
var { useState, useEffect, useCallback, useRef, useMemo, createContext, useContext } = React;

const Ctx = createContext(null);
function useApp() { return useContext(Ctx); }

function ls(key, def) { try { return JSON.parse(localStorage.getItem(key) ?? 'null') ?? def; } catch { return def; } }
function lsSet(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch { } }

// ── SUPABASE CLIENT ───────────────────────────────────────────────────────────
const SB_URL = 'https://sjotifqahfcylcooaqxm.supabase.co';
const SB_KEY = 'sb_publishable_3h4-HTzlMANQA-T2FMaavQ_uso2rIGj';
const supabase = (typeof window.supabase !== 'undefined') ? window.supabase.createClient(SB_URL, SB_KEY) : null;

function AppProvider({ children }) {
  // ── Catalog State (Live from Supabase) ──
  const [liveApps, setLiveApps] = useState(typeof APPS !== 'undefined' ? APPS : []);
  const [liveGames, setLiveGames] = useState(typeof GAMES !== 'undefined' ? GAMES : []);
  const [rawApps, setRawApps] = useState([]);
  const [rawGames, setRawGames] = useState([]);
  const [liveCats, setLiveCats] = useState(typeof HOME_CATEGORIES !== 'undefined' ? [...HOME_CATEGORIES.map(c => ({ ...c, type: 'app' })), ...GAME_CATEGORIES.map(c => ({ ...c, type: 'game' }))] : []);
  const [settings, setSettings] = useState({ app_name: 'ZeroApp' });

  // ── Auth State ──
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [userProfile, setUserProfile] = useState(() => ls('zero_guest_profile', null));

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user || null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    if (user && supabase) {
      supabase.from('profiles').select('*').eq('id', user.id).single()
        .then(({ data, error }) => {
          if (data) setUserProfile(data);
        });
    } else {
      setUserProfile(ls('zero_guest_profile', null));
    }
  }, [user, supabase]);

  const updateProfileName = async (newName) => {
    setUserProfile(prev => {
      const next = { ...(prev || {}), display_name: newName };
      lsSet('zero_guest_profile', next); // Persist for guests too
      return next;
    });

    if (user && supabase) {
      const { error } = await supabase.from('profiles').update({ display_name: newName }).eq('id', user.id);
      if (error) console.error('Error updating name in DB:', error);
    }
  };

  const signIn = useCallback(async (email, password) => await supabase.auth.signInWithPassword({ email, password }), []);
  const signUp = useCallback(async (email, password) => await supabase.auth.signUp({ email, password }), []);
  const signOut = useCallback(async () => await supabase.auth.signOut(), []);
  const signInWithGoogle = useCallback(async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + window.location.pathname,
        skipBrowserRedirect: true
      }
    });
    if (data?.url) {
      // This forces the device to open the system browser instead of the embedded WebView
      // '_system' is used by many app wrappers, '_blank' falls back to a new tab.
      window.open(data.url, '_system') || window.open(data.url, '_blank');
    }
  }, []);

  // ── Navigation state (Native Stack) ──
  const [history, setHistory] = useState([{ key: 'root-apps', id: 'apps', params: {} }]);
  const [mainTab, setMainTab] = useState('apps'); // 'apps' | 'games'

  const screen = history[history.length - 1].id;

  // ── Domain state ──
  const [searchQ, setSearchQ] = useState('');

  // ── Persistent ──
  const [recents, setRecents] = useState(() => ls('zero_recents', []));
  const [savedApps, setSavedApps] = useState(() => ls('zero_saved_apps', []));
  const [folders, setFolders] = useState(() => ls('zero_folders', []));
  const [lang, setLangState] = useState(() => ls('zero_lang', 'en'));
  const [theme, setThemeState] = useState(() => ls('zero_theme', 'dark'));
  const [userRegion, setUserRegionState] = useState(() => ls('zero_region', 'Global'));
  const [promotions, setPromotions] = useState([]);
  const [recentSearches, setRecentSearchesState] = useState(() => ls('zero_recent_searches', []));

  useEffect(() => {
    document.documentElement.dir = (lang === 'ar' || lang === 'ur') ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    document.documentElement.className = theme === 'light' ? 'light-mode' : '';
  }, [lang, theme]);

  const setLang = useCallback((l) => { setLangState(l); lsSet('zero_lang', l); }, []);
  const setTheme = useCallback((t) => { setThemeState(t); lsSet('zero_theme', t); document.documentElement.className = t === 'light' ? 'light-mode' : ''; }, []);
  const setUserRegion = useCallback((r) => { 
    setUserRegionState(r); 
    lsSet('zero_region', r);
    lsSet('zero_region_detected', true); // User manually changed, so we mark it as "detected" (handled)
  }, []);

  const updateSearchHistory = useCallback((term) => {
    if (!term || term.length < 2) return;
    logActivity('search', null, { term });
    setRecentSearchesState(prev => {
      const next = [term, ...prev.filter(t => t !== term)].slice(0, 10);
      lsSet('zero_recent_searches', next);
      return next;
    });
  }, []);

  const clearSearchHistory = useCallback(() => {
    setRecentSearchesState([]);
    lsSet('zero_recent_searches', []);
  }, []);

  // ── Geolocation Detection ──
  useEffect(() => {
    const isDetected = ls('zero_region_detected', false);
    if (!isDetected) {
      fetch('https://ipapi.co/json/')
        .then(res => res.json())
        .then(data => {
          if (data.country_code) {
             const code = data.country_code;
             let region = 'Global';
             if (code === 'PK') region = 'PK';
             else if (code === 'US') region = 'US';
             else if (code === 'GB') region = 'UK';
             else if (code === 'AE') region = 'AE';
             
             if (region !== 'Global') {
               setUserRegionState(region); // Use state directly to avoid triggering the "detected" flag too early if we want
               lsSet('zero_region', region);
             }
          }
          lsSet('zero_region_detected', true);
        })
        .catch(err => {
          console.error('Region detection failed:', err);
          lsSet('zero_region_detected', true); // Don't keep trying if it fails
        });
    }
  }, []);

  // ── Localization ──
  const translations = {
    en: {
      settings: 'Settings',
      profile_settings: 'Profile Settings',
      display_name: 'Display Name',
      email: 'Email',
      app_preferences: 'App Preferences',
      dark_mode: 'Dark Mode',
      notifications: 'Notifications',
      language: 'Language',
      account: 'Account',
      sign_out: 'Sign Out',
      about: 'About ZeroApp',
      help: 'Help & Support',
      save: 'Save',
      cancel: 'Cancel',
      edit: 'Edit',
      done: 'Done',
      version: 'Version',
      faq_title: 'How can we help?',
      faq_sub: "We're here to guide you through ZeroApp",
      about_tagline: 'The Future of Web OS',
      about_desc: 'ZeroApp is a high-performance web operating system designed for the modern era.',
      home_header: 'What would you like to do today?',
      games_header: 'What would you like to play today?',
      search_apps: 'Search apps...',
      search_games: 'Search for games...',
      categories: 'Categories',
      show_all: 'Show All',
      recent_used: 'Recently Used',
      view_all: 'View All',
      see_all: 'See all',
      all: 'All',
      apps: 'Apps',
      explore: 'Explore',
      discover: 'Discover',
      play_now: 'Play Now',
      featured: 'Featured',
      suggested: 'Suggested',
      for_you: 'For you',
      recommended: 'Recommended for you',
      all_apps: 'All Apps',
      all_games: 'All Games',
      no_apps: 'No apps in this category yet',
      no_games: 'No games in this category yet',
      featured_app: 'Featured App',
      recommended_for_you: 'Recommended for you',
      trending: 'Trending',
      featured_apps: 'Featured Apps',
      hot_right_now: 'Hot Right Now',
      top_pick_for_you: 'Top Pick For You',
      editors_picks: "Editor's Picks",
      popular_apps: 'Popular Apps',
      new_experience: 'New Experience',
      super_apps: 'Super Apps',
      apps_might_like: 'Apps You Might Like',
      personalize_recommendations: 'Personalize Recommendations',
      crowd_favorites: 'Crowd Favorites',
      this_month_best: "This Month's Best",
      featured_game: 'Featured Game',
      recommended_games: 'Recommended Games',
      trending_games: 'Trending Games',
      featured_games: 'Featured Games',
      popular_games: 'Popular Games',
      super_games: 'Super Games',
      games_might_like: 'Games You Might Like',
      comments_count: 'Comments',
      leaderboard: 'Leaderboard',
      developer: 'Developer',
      add_comment: 'Add comment...',
      sign_in: 'Sign In',
      search_anything: 'Search anything...',
      top_results: 'Top Results',
      more_apps: 'More Apps',
      recent: 'Recent',
      clear_all: 'Clear all',
      no_recent: 'No Recent Apps',
      no_recent_sub: 'Apps you open will appear here',
      today: 'Today',
      yesterday: 'Yesterday',
      earlier: 'Earlier',
      reviews: 'reviews',
      downloads: 'Downloads',
      everyone: 'Everyone',
      launch_app: 'Launch App',
      save_app: 'Save App',
      saved: 'Saved',
      about_app: 'About this app',
      good_morning: 'Good Morning',
      good_afternoon: 'Good Afternoon',
      good_evening: 'Good Evening',
      games_nav: 'Games',
      apps_nav: 'Apps',
      explore_nav: 'Explore',
      profile_nav: 'Profile',
      close_app: 'Close App',
      cat_ai: 'AI',
      cat_kids: 'Kids',
      cat_ecommerce: 'E-commerce',
      cat_business: 'Business',
      cat_beauty: 'Beauty',
      cat_artdesign: 'Art & Design',
      cat_finance: 'Finance',
      cat_education: 'Education',
      cat_entertainment: 'Entertainment',
      cat_tools: 'Tools',
      cat_health: 'Health',
      cat_social: 'Social',
      games_header: 'Discover the latest hits',
      comments_count: 'Comments',
      leaderboard: 'Leaderboard',
      add_comment: 'Add a comment...',
      pts: 'pts',
      search_games: 'Search games',
      developer: 'Developer',
      all_apps: 'All Apps',
      vision_desc: 'ZeroApp was built with the vision of creating a seamless, cross-platform ecosystem where web applications feel as native as local ones. We believe in a future where you don\'t need to install hundreds of apps on every device.',
      zero_install_desc: 'Run apps instantly from the browser without cluttering your device storage.',
      multi_tasking_desc: 'Switch between multiple apps effortlessly using our unique ZeroOS task switcher.',
      cloud_sync_desc: 'Your profile and saved apps follow you across any device you sign in to.',
      faq_1_q: 'What is ZeroApp?',
      faq_1_a: 'ZeroApp is a web-based operating system that allows you to run multiple web applications simultaneously without any installation.',
      faq_2_q: 'How do I add apps to my profile?',
      faq_2_a: 'You can save apps from the Explore or Home screens by clicking the "Save" button in the app details page.',
      faq_3_q: 'Is it free to use?',
      faq_3_a: 'Yes, ZeroApp is completely free for all users.',
      faq_4_q: 'How do I submit my own app?',
      faq_4_a: 'You can submit your web app by clicking the "+" button in the navigation bar and filling out the submission form.',
      profile: 'Profile',
      my_submissions: 'My Submissions',
      login_required: 'Login Required',
      login_sub: 'Sign in to view and track your submitted games and apps.',
      login_review_sub: 'Share your thoughts and rate your experience with the community.',
      login_signup: 'Login / Sign Up',
      no_submissions: 'No submissions yet',
      no_submissions_sub: 'Click the + button below to submit your first game!',
      my_apps: 'My Apps',
      new_folder: 'New Folder',
      folder_name: 'Folder Name',
      create: 'Create',
      apps_count: 'Apps',
      no_apps_saved: 'No Apps Saved',
      no_apps_saved_sub: 'Save apps from the Feed or Explore to see them here.',
      back: 'Back',
      folder_empty: 'This folder is empty. Drag apps here to add them!',
      select_apps: 'Select Apps to include:',
      privacy_policy: 'Privacy Policy',
      terms_service: 'Terms of Service',
      faq: 'Frequently Asked Questions',
      contact_us: 'Contact Us',
      email_support: 'Email Support',
      live_chat: 'Live Chat',
      vision: 'The Vision',
      key_features: 'Key Features',
      zero_install: 'Zero Installation',
      zero_install_sub: 'Run apps instantly from the browser without cluttering your device storage.',
      multi_tasking: 'Multi-tasking',
      multi_tasking_sub: 'Switch between multiple apps effortlessly using our unique ZeroOS task switcher.',
      cloud_sync: 'Cloud Sync',
      cloud_sync_sub: 'Your profile and saved apps follow you across any device you sign in to.',
      stay_connected: 'Stay Connected'
    },
    es: {
      settings: 'Ajustes',
      profile_settings: 'Ajustes de Perfil',
      display_name: 'Nombre de Pantalla',
      email: 'Correo Electrónico',
      app_preferences: 'Preferencias de App',
      dark_mode: 'Modo Oscuro',
      notifications: 'Notificaciones',
      language: 'Idioma',
      account: 'Cuenta',
      sign_out: 'Cerrar Sesión',
      about: 'Sobre ZeroApp',
      help: 'Ayuda y Soporte',
      save: 'Guardar',
      cancel: 'Cancelar',
      edit: 'Editar',
      done: 'Hecho',
      version: 'Versión',
      faq_title: '¿Cómo podemos ayudar?',
      faq_sub: 'Estamos aquí para guiarte en ZeroApp',
      about_tagline: 'El Futuro del Web OS',
      about_desc: 'ZeroApp es un sistema operativo web de alto rendimiento diseñado para la era moderna.',
      home_header: '¿Qué te gustaría hacer hoy?',
      games_header: '¿Qué te gustaría jugar hoy?',
      search_apps: 'Buscar aplicaciones...',
      search_games: 'Buscar juegos...',
      categories: 'Categorías',
      show_all: 'Mostrar todo',
      recent_used: 'Usado recientemente',
      view_all: 'Ver todo',
      see_all: 'Ver todo',
      all: 'Todos',
      apps: 'Aplicaciones',
      explore: 'Explorar',
      discover: 'Descubrir',
      play_now: 'Jugar ahora',
      featured: 'Destacado',
      suggested: 'Sugerido',
      for_you: 'Para ti',
      recommended: 'Recomendado para ti',
      all_apps: 'Todas las aplicaciones',
      all_games: 'Todos los juegos',
      featured_app: 'App Destacada',
      recommended_for_you: 'Recomendado para ti',
      trending: 'Tendencias',
      featured_apps: 'Apps Destacadas',
      hot_right_now: 'Popular ahora',
      top_pick_for_you: 'Mejor selección para ti',
      editors_picks: 'Selección del editor',
      popular_apps: 'Apps populares',
      new_experience: 'Nueva experiencia',
      super_apps: 'Súper Apps',
      apps_might_like: 'Apps que te podrían gustar',
      personalize_recommendations: 'Personalizar recomendaciones',
      crowd_favorites: 'Favoritos del público',
      this_month_best: 'Lo mejor de este mes',
      featured_game: 'Juego Destacado',
      recommended_games: 'Juegos Recomendados',
      trending_games: 'Juegos en Tendencia',
      featured_games: 'Juegos Destacados',
      popular_games: 'Juegos Populares',
      super_games: 'Súper Juegos',
      games_might_like: 'Juegos que te podrían gustar',
      no_apps: 'Aún no hay aplicaciones en esta categoría',
      no_games: 'Aún no hay juegos en esta categoría',
      comments_count: 'Comentarios',
      leaderboard: 'Tabla de clasificación',
      developer: 'Desarrollador',
      add_comment: 'Añadir comentario...',
      sign_in: 'Iniciar sesión',
      search_anything: 'Buscar algo...',
      top_results: 'Mejores resultados',
      more_apps: 'Más aplicaciones',
      recent: 'Reciente',
      clear_all: 'Borrar todo',
      no_recent: 'No hay aplicaciones recientes',
      no_recent_sub: 'Las aplicaciones que abras aparecerán aquí',
      today: 'Hoy',
      yesterday: 'Ayer',
      earlier: 'Antes',
      reviews: 'reseñas',
      downloads: 'Descargas',
      everyone: 'Todos',
      launch_app: 'Iniciar aplicación',
      save_app: 'Guardar aplicación',
      saved: 'Guardado',
      about_app: 'Acerca de esta aplicación',
      good_morning: 'Buenos Días',
      good_afternoon: 'Buenas Tardes',
      good_evening: 'Buenas Noches',
      games_nav: 'Juegos',
      apps_nav: 'Apps',
      explore_nav: 'Explorar',
      profile_nav: 'Perfil',
      close_app: 'Cerrar App',
      cat_ai: 'IA',
      cat_kids: 'Niños',
      cat_ecommerce: 'Comercio',
      cat_business: 'Negocios',
      cat_beauty: 'Belleza',
      cat_artdesign: 'Arte y Diseño',
      cat_finance: 'Finanzas',
      cat_education: 'Educación',
      cat_entertainment: 'Entretenimiento',
      cat_tools: 'Herramientas',
      cat_health: 'Salud',
      cat_social: 'Social',
      games_header: 'Descubre los últimos éxitos',
      comments_count: 'Comentarios',
      leaderboard: 'Tabla de clasificación',
      add_comment: 'Añadir un comentario...',
      pts: 'pts',
      search_games: 'Buscar juegos',
      developer: 'Desarrollador',
      all_apps: 'Todas las Apps',
      vision_desc: 'ZeroApp fue creado con la visión de un ecosistema multiplataforma fluido donde las aplicaciones web se sienten tan nativas como las locales. Creemos en un futuro donde no necesites instalar cientos de apps en cada dispositivo.',
      zero_install_desc: 'Ejecuta apps al instante desde el navegador sin llenar el almacenamiento de tu dispositivo.',
      multi_tasking_desc: 'Cambia entre múltiples apps sin esfuerzo usando nuestro selector de tareas ZeroOS único.',
      cloud_sync_desc: 'Tu perfil y apps guardadas te siguen en cualquier dispositivo en el que inicies sesión.',
      faq_1_q: '¿Qué es ZeroApp?',
      faq_1_a: 'ZeroApp es un sistema operativo basado en la web que te permite ejecutar múltiples aplicaciones web simultáneamente sin ninguna instalación.',
      faq_2_q: '¿Cómo añado apps a mi perfil?',
      faq_2_a: 'Puedes guardar apps desde las pantallas de Explorar o Inicio haciendo clic en el botón "Guardar" en la página de detalles de la app.',
      faq_3_q: '¿Es de uso gratuito?',
      faq_3_a: 'Sí, ZeroApp es completamente gratuito para todos los usuarios.',
      faq_4_q: '¿Cómo envío mi propia app?',
      faq_4_a: 'Puedes enviar tu app web haciendo clic en el botón "+" en la barra de navegación y completando el formulario de envío.',
      profile: 'Perfil',
      my_submissions: 'Mis Entregas',
      login_required: 'Inicio de Sesión Requerido',
      login_sub: 'Inicia sesión para ver y rastrear tus juegos y apps entregados.',
      login_review_sub: 'Comparte tu opinión y califica tu experiencia con la comunidad.',
      login_signup: 'Iniciar Sesión / Registrarse',
      no_submissions: 'Aún no hay entregas',
      no_submissions_sub: '¡Haz clic en el botón + de abajo para entregar tu primer juego!',
      my_apps: 'Mis Apps',
      new_folder: 'Nueva Carpeta',
      folder_name: 'Nombre de la Carpeta',
      create: 'Crear',
      apps_count: 'Apps',
      no_apps_saved: 'No hay Apps Guardadas',
      no_apps_saved_sub: 'Guarda apps desde el Feed o Explorar para verlas aquí.',
      back: 'Atrás',
      folder_empty: 'Esta carpeta está vacía. ¡Arrastra apps aquí para añadirlas!',
      select_apps: 'Selecciona Apps para incluir:',
      privacy_policy: 'Política de Privacidad',
      terms_service: 'Términos de Servicio',
      faq: 'Preguntas Frecuentes',
      contact_us: 'Contáctanos',
      email_support: 'Soporte por Email',
      live_chat: 'Chat en Vivo',
      vision: 'La Visión',
      key_features: 'Características Clave',
      zero_install: 'Instalación Cero',
      zero_install_sub: 'Ejecuta apps al instante desde el navegador sin llenar el almacenamiento de tu dispositivo.',
      multi_tasking: 'Multitarea',
      multi_tasking_sub: 'Cambia entre múltiples apps sin esfuerzo usando nuestro selector de tareas ZeroOS único.',
      cloud_sync: 'Sincronización en la Nube',
      cloud_sync_sub: 'Tu perfil y apps guardadas te siguen en cualquier dispositivo en el que inicies sesión.',
      stay_connected: 'Mantente Conectado'
    },
    fr: {
      settings: 'Paramètres',
      profile_settings: 'Paramètres du Profil',
      display_name: 'Nom d\'affichage',
      email: 'E-mail',
      app_preferences: 'Préférences de l\'App',
      dark_mode: 'Mode Sombre',
      notifications: 'Notifications',
      language: 'Langue',
      account: 'Compte',
      sign_out: 'Déconnexion',
      about: 'À propos de ZeroApp',
      help: 'Aide & Support',
      save: 'Enregistrer',
      cancel: 'Annuler',
      edit: 'Modifier',
      done: 'Terminé',
      version: 'Version',
      faq_title: 'Comment pouvons-nous aider ?',
      faq_sub: 'Nous sommes là pour vous guider à travers ZeroApp',
      about_tagline: 'L\'avenir du Web OS',
      about_desc: 'ZeroApp est un système d\'exploitation Web haute performance conçu pour l\'ère moderne.',
      home_header: 'Que aimeriez-vous faire aujourd\'hui ?',
      games_header: 'À quoi aimeriez-vous jouer aujourd\'hui ?',
      search_apps: 'Rechercher des applications...',
      search_games: 'Rechercher des jeux...',
      categories: 'Catégories',
      show_all: 'Afficher tout',
      recent_used: 'Récemment utilisé',
      view_all: 'Voir tout',
      see_all: 'Voir tout',
      all: 'Tout',
      apps: 'Applications',
      explore: 'Explorer',
      discover: 'Découvrir',
      play_now: 'Jouer maintenant',
      featured: 'Vedette',
      suggested: 'Suggéré',
      for_you: 'Pour vous',
      recommended: 'Recommandé pour vous',
      all_apps: 'Toutes les applications',
      all_games: 'Tous les jeux',
      no_apps: 'Pas encore d\'applications dans cette catégorie',
      no_games: 'Pas encore de jeux dans cette catégorie',
      comments_count: 'Commentaires',
      leaderboard: 'Classement',
      developer: 'Développeur',
      add_comment: 'Ajouter un commentaire...',
      sign_in: 'Se connecter',
      search_anything: 'Rechercher n\'importe quoi...',
      top_results: 'Top résultats',
      more_apps: 'Plus d\'applications',
      recent: 'Récent',
      clear_all: 'Tout effacer',
      no_recent: 'Aucune application récente',
      no_recent_sub: 'Les applications que vous ouvrez apparaîtront ici',
      today: 'Aujourd\'hui',
      yesterday: 'Hier',
      earlier: 'Plus tôt',
      reviews: 'avis',
      downloads: 'Téléchargements',
      everyone: 'Tous',
      launch_app: 'Lancer l\'application',
      save_app: 'Enregistrer l\'application',
      saved: 'Enregistré',
      about_app: 'À propos de cette application',
      good_morning: 'Bon Matin',
      good_afternoon: 'Bon Après-midi',
      good_evening: 'Bonsoir',
      games_nav: 'Jeux',
      apps_nav: 'Apps',
      explore_nav: 'Explorer',
      profile_nav: 'Profil',
      close_app: 'Fermer l\'App',
      cat_ai: 'IA',
      cat_kids: 'Enfants',
      cat_ecommerce: 'Commerce',
      cat_business: 'Affaires',
      cat_beauty: 'Beauté',
      cat_artdesign: 'Art et Design',
      cat_finance: 'Finance',
      cat_education: 'Éducation',
      cat_entertainment: 'Divertissement',
      cat_tools: 'Outils',
      cat_health: 'Santé',
      cat_social: 'Social',
      games_header: 'Découvrez les derniers succès',
      comments_count: 'Commentaires',
      leaderboard: 'Classement',
      add_comment: 'Ajouter un commentaire...',
      pts: 'pts',
      search_games: 'Rechercher des jeux',
      developer: 'Développeur',
      all_apps: 'Toutes les Apps',
      vision_desc: 'ZeroApp a été conçu avec la vision de créer un écosystème multiplateforme fluide où les applications Web semblent aussi natives que les applications locales. Nous croyons en un avenir où vous n\'aurez pas besoin d\'installer des centaines d\'applications sur chaque appareil.',
      zero_install_desc: 'Lancez des applications instantanément depuis le navigateur sans encombrer le stockage de votre appareil.',
      multi_tasking_desc: 'Basculez entre plusieurs applications sans effort grâce à notre sélecteur de tâches ZeroOS unique.',
      cloud_sync_desc: 'Votre profil et vos applications enregistrées vous suivent sur n\'importe quel appareil sur lequel vous vous connectez.',
      faq_1_q: 'Qu\'est-ce que ZeroApp ?',
      faq_1_a: 'ZeroApp est un système d\'exploitation Web qui vous permet d\'exécuter simultanément plusieurs applications Web sans aucune installation.',
      faq_2_q: 'Comment ajouter des applications à mon profil ?',
      faq_2_a: 'Vous pouvez enregistrer des applications à partir des écrans Explorer ou Accueil en cliquant sur le bouton "Enregistrer" dans la page de détails de l\'application.',
      faq_3_q: 'Est-ce gratuit à utiliser ?',
      faq_3_a: 'Oui, ZeroApp est entièrement gratuit pour tous les utilisateurs.',
      faq_4_q: 'Comment soumettre ma propre application ?',
      faq_4_a: 'Vous pouvez soumettre votre application Web en cliquant sur le bouton "+" dans la barre de navigation et en remplissant le formulaire de soumission.',
      profile: 'Profil',
      my_submissions: 'Mes Soumissions',
      login_required: 'Connexion Requise',
      login_sub: 'Connectez-vous pour voir et suivre vos jeux et applications soumis.',
      login_review_sub: 'Partagez votre avis et évaluez votre expérience avec la communauté.',
      login_signup: 'Se Connecter / S\'Inscrire',
      no_submissions: 'Pas encore de soumissions',
      no_submissions_sub: 'Cliquez sur le bouton + ci-dessous pour soumettre votre premier jeu !',
      my_apps: 'Mes Apps',
      new_folder: 'Nouveau Dossier',
      folder_name: 'Nom du Dossier',
      create: 'Créer',
      apps_count: 'Apps',
      no_apps_saved: 'Aucune App Enregistrée',
      no_apps_saved_sub: 'Enregistrez des applications depuis le flux ou l\'exploration pour les voir ici.',
      back: 'Retour',
      folder_empty: 'Ce dossier est vide. Faites glisser des applications ici pour les ajouter !',
      select_apps: 'Sélectionnez les applications à inclure :',
      privacy_policy: 'Politique de Confidentialité',
      terms_service: 'Conditions d\'Utilisation',
      faq: 'Questions Fréquemment Posées',
      contact_us: 'Contactez-nous',
      email_support: 'Support par E-mail',
      live_chat: 'Chat en Direct',
      vision: 'La Vision',
      key_features: 'Caractéristiques Clés',
      zero_install: 'Installation Zéro',
      zero_install_sub: 'Lancez des applications instantanément depuis le navigateur sans encombrer le stockage de votre appareil.',
      multi_tasking: 'Multi-tâches',
      multi_tasking_sub: 'Basculez entre plusieurs applications sans effort grâce à notre sélecteur de tâches ZeroOS unique.',
      cloud_sync: 'Sync Cloud',
      cloud_sync_sub: 'Votre profil et vos applications enregistrées vous suivent sur n\'importe quel appareil sur lequel vous vous connectez.',
      stay_connected: 'Restez Connecté'
    },
    zh: {
      settings: '设置',
      profile_settings: '个人资料设置',
      display_name: '显示名称',
      email: '电子邮件',
      app_preferences: '应用偏好',
      dark_mode: '深色模式',
      notifications: '通知',
      language: '语言',
      account: '账户',
      sign_out: '退出登录',
      about: '关于 ZeroApp',
      help: '帮助与支持',
      save: '保存',
      cancel: '取消',
      edit: '编辑',
      done: '完成',
      version: '版本',
      faq_title: '我们能为您提供什么帮助？',
      faq_sub: '我们在这里引导您使用 ZeroApp',
      about_tagline: 'Web OS 的未来',
      about_desc: 'ZeroApp 是专为现代时代设计的高性能 Web 操作系统。',
      home_header: '今天你想做什么？',
      games_header: '今天你想玩什么？',
      search_apps: '搜索应用...',
      search_games: '搜索游戏...',
      categories: '类别',
      show_all: '显示全部',
      recent_used: '最近使用',
      view_all: '查看全部',
      see_all: '查看全部',
      all: '全部',
      apps: '应用',
      explore: '探索',
      discover: '发现',
      play_now: '立即玩',
      featured: '精选',
      suggested: '建议',
      for_you: '为您推荐',
      recommended: '为您推荐',
      all_apps: '全部应用',
      all_games: '全部游戏',
      no_apps: '此类别中尚无应用',
      no_games: '此类别中尚无游戏',
      comments_count: '评论',
      leaderboard: '排行榜',
      developer: '开发者',
      add_comment: '添加评论...',
      sign_in: '登录',
      search_anything: '搜索任何内容...',
      top_results: '热门结果',
      more_apps: '更多应用',
      recent: '最近',
      clear_all: '全部清除',
      no_recent: '无最近应用',
      no_recent_sub: '您打开的应用将显示在此处',
      today: '今天',
      yesterday: '昨天',
      earlier: '更早',
      reviews: '条评论',
      downloads: '次下载',
      everyone: '所有人',
      launch_app: '启动应用',
      save_app: '保存应用',
      saved: '已保存',
      about_app: '关于此应用',
      good_morning: '早上好',
      good_afternoon: '下午好',
      good_evening: '晚上好',
      games_nav: '游戏',
      apps_nav: '应用',
      explore_nav: '探索',
      profile_nav: '个人资料',
      close_app: '关闭应用',
      cat_ai: '人工智能',
      cat_kids: '儿童',
      cat_ecommerce: '电子商务',
      cat_business: '商务',
      cat_beauty: '美容',
      cat_artdesign: '艺术与设计',
      cat_finance: '金融',
      cat_education: '教育',
      cat_entertainment: '娱乐',
      cat_tools: '工具',
      cat_health: '健康',
      cat_social: '社交',
      games_header: '发现最新热门游戏',
      comments_count: '评论',
      leaderboard: '排行榜',
      add_comment: '添加评论...',
      pts: '分',
      search_games: '搜索游戏',
      developer: '开发者',
      all_apps: '所有应用',
      vision_desc: 'ZeroApp 的愿景是创建一个无缝的跨平台生态系统，让 Web 应用程序的感觉像原生应用程序一样。我们相信未来的你不需要在每个设备上安装数百个应用程序。',
      zero_install_desc: '从浏览器立即运行应用，不占用设备存储。',
      multi_tasking_desc: '使用我们独特的 ZeroOS 任务切换器轻松在多个应用之间切换。',
      cloud_sync_desc: '您的个人资料和保存的应用会跟随您在任何登录的设备上。',
      faq_1_q: '什么是 ZeroApp？',
      faq_1_a: 'ZeroApp 是一个基于 Web 的操作系统，允许您在无需任何安装的情况下同时运行多个 Web 应用程序。',
      faq_2_q: '如何将应用添加到我的个人资料？',
      faq_2_a: '您可以通过点击应用详情页面中的“保存”按钮，从“探索”或“首页”屏幕保存应用。',
      faq_3_q: '是否免费使用？',
      faq_3_a: '是的，ZeroApp 对所有用户完全免费。',
      faq_4_q: '如何提交我自己的应用？',
      faq_4_a: '您可以通过点击导航栏中的“+”按钮并填写提交表单来提交您的 Web 应用。',
      profile: '个人资料',
      my_submissions: '我的提交',
      login_required: '需要登录',
      login_sub: '登录以查看和跟踪您提交的游戏和应用。',
      login_review_sub: '与社区分享您的想法并评估您的体验。',
      login_signup: '登录 / 注册',
      no_submissions: '尚无提交',
      no_submissions_sub: '点击下面的 + 按钮提交您的第一个游戏！',
      my_apps: '我的应用',
      new_folder: '新建文件夹',
      folder_name: '文件夹名称',
      create: '创建',
      apps_count: '应用',
      no_apps_saved: '无保存的应用',
      no_apps_saved_sub: '从 Feed 或探索中保存应用以在此处查看。',
      back: '返回',
      folder_empty: '此文件夹为空。将应用拖到此处添加！',
      select_apps: '选择要包含的应用：',
      privacy_policy: '隐私政策',
      terms_service: '服务条款',
      faq: '常见问题',
      contact_us: '联系我们',
      email_support: '电子邮件支持',
      live_chat: '在线聊天',
      vision: '愿景',
      key_features: '主要功能',
      zero_install: '零安装',
      zero_install_sub: '从浏览器立即运行应用，不占用设备存储。',
      multi_tasking: '多任务处理',
      multi_tasking_sub: '使用我们独特的 ZeroOS 任务切换器轻松在多个应用之间切换。',
      cloud_sync: '云同步',
      cloud_sync_sub: '您的个人资料和保存的应用会跟随您在任何登录的设备上。',
      stay_connected: '保持联系'
    },
    de: {
      settings: 'Einstellungen',
      profile_settings: 'Profileinstellungen',
      display_name: 'Anzeigename',
      email: 'E-Mail',
      app_preferences: 'App-Einstellungen',
      dark_mode: 'Dunkelmodus',
      notifications: 'Benachrichtigungen',
      language: 'Sprache',
      account: 'Konto',
      sign_out: 'Abmelden',
      about: 'Über ZeroApp',
      help: 'Hilfe & Support',
      save: 'Speichern',
      cancel: 'Abbrechen',
      edit: 'Bearbeiten',
      done: 'Fertig',
      version: 'Version',
      faq_title: 'Wie können wir helfen?',
      faq_sub: 'Wir sind hier, um Sie durch ZeroApp zu führen',
      about_tagline: 'Die Zukunft des Web OS',
      about_desc: 'ZeroApp ist ein leistungsstarkes Web-Betriebssystem, das für die moderne Ära entwickelt wurde.',
      home_header: 'Was möchtest du heute tun?',
      games_header: 'Was möchtest du heute spielen?',
      search_apps: 'Apps suchen...',
      search_games: 'Nach Spielen suchen...',
      categories: 'Kategorien',
      show_all: 'Alle anzeigen',
      recent_used: 'Zuletzt verwendet',
      view_all: 'Alle ansehen',
      see_all: 'Alle ansehen',
      all: 'Alle',
      apps: 'Apps',
      explore: 'Erkunden',
      discover: 'Entdecken',
      play_now: 'Jetzt spielen',
      featured: 'Vorgestellt',
      suggested: 'Vorgeschlagen',
      for_you: 'Für dich',
      recommended: 'Für dich empfohlen',
      all_apps: 'Alle Apps',
      all_games: 'Alle Spiele',
      no_apps: 'Noch keine Apps in dieser Kategorie',
      no_games: 'Noch keine Spiele in dieser Kategorie',
      comments_count: 'Kommentare',
      leaderboard: 'Bestenliste',
      developer: 'Entwickler',
      add_comment: 'Kommentar hinzufügen...',
      sign_in: 'Anmelden',
      search_anything: 'Suchen...',
      top_results: 'Top-Ergebnisse',
      more_apps: 'Weitere Apps',
      recent: 'Zuletzt',
      clear_all: 'Alles löschen',
      no_recent: 'Keine kürzlich verwendeten Apps',
      no_recent_sub: 'Apps, die du öffnest, werden hier angezeigt',
      today: 'Heute',
      yesterday: 'Gestern',
      earlier: 'Früher',
      reviews: 'Bewertungen',
      downloads: 'Downloads',
      everyone: 'Jeder',
      launch_app: 'App starten',
      save_app: 'App speichern',
      saved: 'Gespeichert',
      about_app: 'Über diese App',
      good_morning: 'Guten Morgen',
      good_afternoon: 'Guten Tag',
      good_evening: 'Guten Abend',
      games_nav: 'Spiele',
      apps_nav: 'Apps',
      explore_nav: 'Erkunden',
      profile_nav: 'Profil',
      close_app: 'App schließen',
      cat_ai: 'KI',
      cat_kids: 'Kinder',
      cat_ecommerce: 'E-Commerce',
      cat_business: 'Business',
      cat_beauty: 'Beauty',
      cat_artdesign: 'Kunst & Design',
      cat_finance: 'Finanzen',
      cat_education: 'Bildung',
      cat_entertainment: 'Unterhaltung',
      cat_tools: 'Tools',
      cat_health: 'Gesundheit',
      cat_social: 'Soziales',
      games_header: 'Entdecke die neuesten Hits',
      comments_count: 'Kommentare',
      leaderboard: 'Bestenliste',
      add_comment: 'Einen Kommentar hinzufügen...',
      pts: 'Pkt',
      search_games: 'Spiele suchen',
      developer: 'Entwickler',
      all_apps: 'Alle Apps',
      vision_desc: 'ZeroApp wurde mit der Vision entwickelt, ein nahtloses, plattformübergreifendes Ökosystem zu schaffen, in dem sich Webanwendungen so nativ wie lokale anfühlen. Wir glauben an eine Zukunft, in der Sie nicht Hunderte von Apps auf jedem Gerät installieren müssen.',
      zero_install_desc: 'Starten Sie Apps sofort über den Browser, ohne den Speicher Ihres Geräts zu belegen.',
      multi_tasking_desc: 'Wechseln Sie mühelos zwischen mehreren Apps mit unserem einzigartigen ZeroOS Task-Switcher.',
      cloud_sync_desc: 'Ihr Profil und Ihre gespeicherten Apps folgen Ihnen auf jedes Gerät, auf dem Sie sich anmelden.',
      faq_1_q: 'Was ist ZeroApp?',
      faq_1_a: 'ZeroApp ist ein webbasiertes Betriebssystem, mit dem Sie mehrere Webanwendungen gleichzeitig ohne Installation ausführen können.',
      faq_2_q: 'Wie füge ich Apps zu meinem Profil hinzu?',
      faq_2_a: 'Sie können Apps über die Bildschirme "Entdecken" oder "Start" speichern, indem Sie auf der App-Detailseite auf die Schaltfläche "Speichern" klicken.',
      faq_3_q: 'Ist die Nutzung kostenlos?',
      faq_3_a: 'Ja, ZeroApp ist für alle Nutzer völlig kostenlos.',
      faq_4_q: 'Wie reiche ich meine eigene App ein?',
      faq_4_a: 'Sie können Ihre Web-App einreichen, indem Sie auf das "+"-Symbol in der Navigationsleiste klicken und das Einreichungsformular ausfüllen.',
      profile: 'Profil',
      my_submissions: 'Meine Einreichungen',
      login_required: 'Anmeldung erforderlich',
      login_sub: 'Melden Sie sich an, um Ihre eingereichten Spiele und Apps zu sehen.',
      login_review_sub: 'Teilen Sie Ihre Gedanken und bewerten Sie Ihre Erfahrung mit der Community.',
      login_signup: 'Anmelden / Registrieren',
      no_submissions: 'Noch keine Einreichungen',
      no_submissions_sub: 'Klicken Sie auf das + unten, um Ihr erstes Spiel einzureichen!',
      my_apps: 'Meine Apps',
      new_folder: 'Neuer Ordner',
      folder_name: 'Ordnername',
      create: 'Erstellen',
      apps_count: 'Apps',
      no_apps_saved: 'Keine Apps gespeichert',
      no_apps_saved_sub: 'Speichere Apps aus dem Feed oder Entdecken, um sie hier zu sehen.',
      back: 'Zurück',
      folder_empty: 'Dieser Ordner ist leer. Ziehe Apps hierher, um sie hinzuzufügen!',
      select_apps: 'Wähle Apps zum Hinzufügen aus:',
      privacy_policy: 'Datenschutzbestimmungen',
      terms_service: 'Nutzungsbedingungen',
      faq: 'Häufig gestellte Fragen',
      contact_us: 'Kontaktieren Sie uns',
      email_support: 'E-Mail-Unterstützung',
      live_chat: 'Live-Chat',
      vision: 'Die Vision',
      key_features: 'Hauptmerkmale',
      zero_install: 'Keine Installation',
      zero_install_sub: 'Starte Apps sofort über den Browser, ohne den Speicher deines Geräts zu belegen.',
      multi_tasking: 'Multitasking',
      multi_tasking_sub: 'Wechsle mühelos zwischen mehreren Apps mit unserem einzigartigen ZeroOS Task-Switcher.',
      cloud_sync: 'Cloud-Sync',
      cloud_sync_sub: 'Dein Profil und deine gespeicherten Apps folgen dir auf jedes Gerät, auf dem du dich anmeldest.',
      stay_connected: 'Bleiben Sie in Verbindung'
    },
    ur: {
      settings: 'ترتیبات',
      profile_settings: 'پروفائل کی ترتیبات',
      display_name: 'ظاہری نام',
      email: 'ای میل',
      app_preferences: 'ایپ کی ترجیحات',
      dark_mode: 'ڈارک موڈ',
      notifications: 'اطلاعات',
      language: 'زبان',
      account: 'اکاؤنٹ',
      sign_out: 'سائن آؤٹ',
      about: 'زیرو ایپ کے بارے میں',
      help: 'مدد اور سپورٹ',
      save: 'محفوظ کریں',
      cancel: 'منسوخ کریں',
      edit: 'ترمیم کریں',
      done: 'مکمل',
      version: 'ورژن',
      faq_title: 'ہم آپ کی کیا مدد کر سکتے ہیں؟',
      faq_sub: 'ہم یہاں زیرو ایپ کے ذریعے آپ کی رہنمائی کے لیے موجود ہیں',
      about_tagline: 'ویب OS کا مستقبل',
      about_desc: 'زیرو ایپ ایک اعلی کارکردگی والا ویب آپریٹنگ سسٹم ہے جو جدید دور کے لیے ڈیزائن کیا گیا ہے۔',
      home_header: 'آج آپ کیا کرنا چاہیں گے؟',
      games_header: 'آج آپ کیا کھیلنا چاہیں گے؟',
      search_apps: 'ایپس تلاش کریں...',
      search_games: 'گیمز تلاش کریں...',
      categories: 'اقسام',
      show_all: 'سب دکھائیں',
      recent_used: 'حالیہ استعمال شدہ',
      view_all: 'سب دیکھیں',
      see_all: 'سب دیکھیں',
      all: 'تمام',
      apps: 'ایپس',
      explore: 'دریافت کریں',
      discover: 'دریافت کریں',
      play_now: 'ابھی کھیلیں',
      featured: 'نمایاں',
      suggested: 'تجویز کردہ',
      for_you: 'آپ کے لیے',
      recommended: 'آپ کے لیے تجویز کردہ',
      all_apps: 'تمام ایپس',
      all_games: 'تمام گیمز',
      no_apps: 'اس زمرے میں ابھی کوئی ایپس نہیں ہیں',
      no_games: 'اس زمرے میں ابھی کوئی گیمز نہیں ہیں',
      comments_count: 'تبصرے',
      leaderboard: 'لیڈر بورڈ',
      developer: 'ڈویلپر',
      add_comment: 'تبصرہ کریں...',
      sign_in: 'سائن ان',
      search_anything: 'کچھ بھی تلاش کریں...',
      top_results: 'ٹاپ نتائج',
      more_apps: 'مزید ایپس',
      recent: 'حالیہ',
      clear_all: 'سب صاف کریں',
      no_recent: 'کوئی حالیہ ایپس نہیں',
      no_recent_sub: 'آپ جو ایپس کھولیں گے وہ یہاں نظر آئیں گی',
      today: 'آج',
      yesterday: 'کل',
      earlier: 'پہلے',
      reviews: 'جائزے',
      downloads: 'ڈاؤن لوڈز',
      everyone: 'ہر کوئی',
      launch_app: 'ایپ لانچ کریں',
      save_app: 'ایپ محفوظ کریں',
      saved: 'محفوظ کیا گیا',
      about_app: 'اس ایپ کے بارے میں',
      good_morning: 'صبح بخیر',
      good_afternoon: 'سہ پہر بخیر',
      good_evening: 'شام بخیر',
      games_nav: 'گیمز',
      apps_nav: 'ایپس',
      explore_nav: 'دریافت',
      profile_nav: 'پروفائل',
      close_app: 'ایپ بند کریں',
      cat_ai: 'مصنوعی ذہانت',
      cat_kids: 'بچے',
      cat_ecommerce: 'ای کامرس',
      cat_business: 'کاروبار',
      cat_beauty: 'خوبصورتی',
      cat_artdesign: 'فن اور ڈیزائن',
      cat_finance: 'مالیات',
      cat_education: 'تعلیم',
      cat_entertainment: 'تفریح',
      cat_tools: 'اوزار',
      cat_health: 'صحت',
      cat_social: 'سماجی',
      games_header: 'تازہ ترین ہٹ دریافت کریں',
      comments_count: 'تبصرے',
      leaderboard: 'لیڈر بورڈ',
      add_comment: 'تبصرہ شامل کریں...',
      pts: 'پوائنٹس',
      search_games: 'گیمز تلاش کریں',
      developer: 'ڈویلپر',
      all_apps: 'تمام ایپس',
      vision_desc: 'زیرو ایپ کو ایک ہموار، کراس پلیٹ فارم ایکو سسٹم بنانے کے وژن کے ساتھ بنایا گیا تھا جہاں ویب ایپلی کیشنز مقامی ایپس کی طرح محسوس ہوتی ہیں۔ ہم ایک ایسے مستقبل پر یقین رکھتے ہیں جہاں آپ کو ہر ڈیوائس پر سینکڑوں ایپس انسٹال کرنے کی ضرورت نہیں ہوگی۔',
      zero_install_desc: 'اپنے آلے کی اسٹوریج کو بھرے بغیر براؤزر سے فوری طور پر ایپس چلائیں۔',
      multi_tasking_desc: 'ہمارے منفرد ZeroOS ٹاسک سوئچر کا استعمال کرتے ہوئے متعدد ایپس کے درمیان آسانی سے سوئچ کریں۔',
      cloud_sync_desc: 'آپ کا پروفائل اور محفوظ کردہ ایپس کسی بھی ڈیوائس پر آپ کے ساتھ ہیں جہاں آپ سائن ان کرتے ہیں۔',
      faq_1_q: 'زیرو ایپ کیا ہے؟',
      faq_1_a: 'زیرو ایپ ایک ویب پر مبنی آپریٹنگ سسٹم ہے جو آپ کو بغیر کسی انسٹالیشن کے بیک وقت کئی ویب ایپلی کیشنز چلانے کی اجازت دیتا ہے۔',
      faq_2_q: 'میں اپنے پروفائل میں ایپس کیسے شامل کروں؟',
      faq_2_a: 'آپ ایپ کی تفصیلات کے صفحے میں "محفوظ کریں" بٹن پر کلک کر کے ایکسپلور یا ہوم اسکرین سے ایپس محفوظ کر سکتے ہیں۔',
      faq_3_q: 'کیا یہ استعمال کرنا مفت ہے؟',
      faq_3_a: 'جی ہاں، زیرو ایپ تمام صارفین کے لیے مکمل طور پر مفت ہے۔',
      faq_4_q: 'میں اپنی ایپ کیسے جمع کرواؤں؟',
      faq_4_a: 'آپ نیویگیشن بار میں "+" بٹن پر کلک کر کے اور جمع کرانے کا فارم بھر کر اپنی ویب ایپ جمع کروا سکتے ہیں۔',
      profile: 'پروفائل',
      my_submissions: 'میری گذارشات',
      login_required: 'لاگ ان درکار ہے',
      login_sub: 'اپنے جمع کرائے گئے گیمز اور ایپس کو دیکھنے کے لیے سائن ان کریں۔',
      login_review_sub: 'برادری کے ساتھ اپنے خیالات بانٹیں اور اپنے تجربے کی درجہ بندی کریں۔',
      login_signup: 'لاگ ان / سائن اپ',
      no_submissions: 'ابھی تک کوئی گذارشات نہیں ہیں',
      no_submissions_sub: 'اپنا پہلا گیم جمع کرانے کے لیے نیچے + بٹن پر کلک کریں!',
      my_apps: 'میری ایپس',
      new_folder: 'نیا فولڈر',
      folder_name: 'فولڈر کا نام',
      create: 'بنائیں',
      apps_count: 'ایپس',
      no_apps_saved: 'کوئی ایپس محفوظ نہیں ہیں',
      no_apps_saved_sub: 'فیڈ یا ڈسکور سے ایپس کو یہاں دیکھنے کے لیے محفوظ کریں۔',
      back: 'واپس',
      folder_empty: 'یہ فولڈر خالی ہے۔ ایپس کو شامل کرنے کے لیے یہاں گھسیٹیں!',
      select_apps: 'شامل کرنے کے لیے ایپس منتخب کریں:',
      privacy_policy: 'رازداری کی پالیسی',
      terms_service: 'سروس کی شرائط',
      faq: 'اکثر پوچھے گئے سوالات',
      contact_us: 'ہم سے رابطہ کریں',
      email_support: 'ای میل سپورٹ',
      live_chat: 'لائیو چیٹ',
      vision: 'وژن',
      key_features: 'اہم خصوصیات',
      zero_install: 'زیرو انسٹالیشن',
      zero_install_sub: 'اپنے آلے کی اسٹوریج کو بھرے بغیر براؤزر سے فوری طور پر ایپس چلائیں۔',
      multi_tasking: 'ملٹی ٹاسکنگ',
      multi_tasking_sub: 'ہمارے منفرد ZeroOS ٹاسک سوئچر کا استعمال کرتے ہوئے متعدد ایپس کے درمیان آسانی سے سوئچ کریں۔',
      cloud_sync: 'کلاؤڈ سنک',
      cloud_sync_sub: 'آپ کا پروفائل اور محفوظ کردہ ایپس کسی بھی ڈیوائس پر آپ کے ساتھ ہیں جہاں آپ سائن ان کرتے ہیں۔',
      stay_connected: 'رابطے میں رہیں'
    },
    hi: {
      settings: 'सेटिंग्स',
      profile_settings: 'प्रोफ़ाइल सेटिंग्स',
      display_name: 'प्रदर्शित नाम',
      email: 'ईमेल',
      app_preferences: 'ऐप प्राथमिकताएं',
      dark_mode: 'डार्क मोड',
      notifications: 'सूचनाएं',
      language: 'भाषा',
      account: 'खाता',
      sign_out: 'साइन आउट',
      about: 'ज़ीरोऐप के बारे में',
      help: 'सहायता और समर्थन',
      save: 'सहेजें',
      cancel: 'रद्द करें',
      edit: 'संपादित करें',
      done: 'हो गया',
      version: 'संस्करण',
      faq_title: 'हम आपकी क्या मदद कर सकते हैं?',
      faq_sub: 'हम यहाँ ज़ीरोऐप के माध्यम से आपका मार्गदर्शन करने के लिए हैं',
      about_tagline: 'वेब OS का भविष्य',
      about_desc: 'ज़ीरोऐप एक उच्च प्रदर्शन वाला वेब ऑपरेटिंग सिस्टम है जिसे आधुनिक युग के लिए डिज़ाइन किया गया है।',
      home_header: 'आज आप क्या करना चाहेंगे?',
      games_header: 'आज आप क्या खेलना चाहेंगे?',
      search_apps: 'ऐप्स खोजें...',
      search_games: 'गेम खोजें...',
      categories: 'श्रेणियाँ',
      show_all: 'सभी दिखाएं',
      recent_used: 'हाल ही में इस्तेमाल किया गया',
      view_all: 'सभी देखें',
      see_all: 'सभी देखें',
      all: 'सभी',
      apps: 'ऐप्स',
      explore: 'एक्सप्लोर करें',
      discover: 'खोजें',
      play_now: 'अभी खेलें',
      featured: 'विशेष',
      suggested: 'सुझाए गए',
      for_you: 'आपके लिए',
      recommended: 'आपके लिए अनुशंसित',
      all_apps: 'सभी ऐप्स',
      all_games: 'सभी गेम',
      no_apps: 'इस श्रेणी में अभी कोई ऐप नहीं है',
      no_games: 'इस श्रेणी में अभी कोई खेल नहीं है',
      comments_count: 'टिप्पणियाँ',
      leaderboard: 'लीडरबोर्ड',
      developer: 'डेवलपर',
      add_comment: 'टिप्पणी जोड़ें...',
      sign_in: 'साइन इन',
      search_anything: 'कुछ भी खोजें...',
      top_results: 'शीर्ष परिणाम',
      more_apps: 'अधिक ऐप्स',
      recent: 'हाल ही में',
      clear_all: 'सभी साफ़ करें',
      no_recent: 'कोई हालिया ऐप नहीं',
      no_recent_sub: 'आपके द्वारा खोले गए ऐप्स यहाँ दिखाई देंगे',
      today: 'आज',
      yesterday: 'कल',
      earlier: 'पहले',
      reviews: 'समीक्षाएं',
      downloads: 'डाउनलोड',
      everyone: 'सभी के लिए',
      launch_app: 'ऐप लॉन्च करें',
      save_app: 'ऐप सुरक्षित करें',
      saved: 'सुरक्षित किया गया',
      about_app: 'इस ऐप के बारे में',
      good_morning: 'सुप्रभात',
      good_afternoon: 'नमस्ते',
      good_evening: 'शुभ संध्या',
      games_nav: 'खेल',
      apps_nav: 'ऐप्स',
      explore_nav: 'एक्सप्लोर',
      profile_nav: 'प्रोफ़ाइल',
      close_app: 'ऐप बंद करें',
      cat_ai: 'एआई',
      cat_kids: 'बच्चे',
      cat_ecommerce: 'ई-कॉमर्स',
      cat_business: 'व्यापार',
      cat_beauty: 'सौंदर्य',
      cat_artdesign: 'कला और डिजाइन',
      cat_finance: 'वित्त',
      cat_education: 'शिक्षा',
      cat_entertainment: 'मनोरंजन',
      cat_tools: 'उपकरण',
      cat_health: 'स्वास्थ्य',
      cat_social: 'सामाजिक',
      games_header: 'नवीनतम हिट खोजें',
      comments_count: 'टिप्पणियाँ',
      leaderboard: 'लीडरबोर्ड',
      add_comment: 'एक टिप्पणी जोड़ें...',
      pts: 'अंक',
      search_games: 'खेल खोजें',
      developer: 'डेवलपर',
      all_apps: 'सभी ऐप्स',
      vision_desc: 'ZeroApp को एक सहज, क्रॉस-प्लेटफ़ॉर्म इकोसिस्टम बनाने के दृष्टिकोण के साथ बनाया गया था जहाँ वेब एप्लिकेशन स्थानीय ऐप्स की तरह ही देशी महसूस होते हैं। हम एक ऐसे भविष्य में विश्वास करते हैं जहाँ आपको हर डिवाइस पर सैकड़ों ऐप इंस्टॉल करने की आवश्यकता नहीं होगी।',
      zero_install_desc: 'अपने डिवाइस स्टोरेज को भरे बिना ब्राउज़र से तुरंत ऐप्स चलाएं।',
      multi_tasking_desc: 'हमारे अद्वितीय ZeroOS टास्क स्विचर का उपयोग करके कई ऐप्स के बीच आसानी से स्विच करें।',
      cloud_sync_desc: 'आपकी प्रोफ़ाइल और सहेजे गए ऐप्स किसी भी डिवाइस पर आपका अनुसरण करते हैं जहाँ आप साइन इन करते हैं।',
      faq_1_q: 'ZeroApp क्या है?',
      faq_1_a: 'ZeroApp एक वेब-आधारित ऑपरेटिंग सिस्टम है जो आपको बिना किसी इंस्टॉलेशन के एक साथ कई वेब एप्लिकेशन चलाने की अनुमति देता है।',
      faq_2_q: 'मैं अपनी प्रोफ़ाइल में ऐप्स कैसे जोड़ूँ?',
      faq_2_a: 'आप ऐप विवरण पृष्ठ में "सहेजें" बटन पर क्लिक करके एक्सप्लोर या होम स्क्रीन से ऐप्स सहेज सकते हैं।',
      faq_3_q: 'क्या इसका उपयोग करना मुफ़्त है?',
      faq_3_a: 'हाँ, ZeroApp सभी उपयोगकर्ताओं के लिए पूरी तरह से मुफ़्त है।',
      faq_4_q: 'मैं अपना ऐप कैसे सबमिट करूँ?',
      faq_4_a: 'आप नेविगेशन बार में "+" बटन पर क्लिक करके और सबमिशन फॉर्म भरकर अपना वेब ऐप सबमिट कर सकते हैं।',
      profile: 'प्रोफ़ाइल',
      my_submissions: 'मेरी प्रस्तुतियाँ',
      login_required: 'लॉगिन आवश्यक',
      login_sub: 'अपने सबमिट किए गए गेम और ऐप्स देखने और ट्रैक करने के लिए साइन इन करें।',
      login_review_sub: 'समुदाय के साथ अपने विचार साझा करें और अपने अनुभव को रेट करें।',
      login_signup: 'लॉगिन / साइन अप',
      no_submissions: 'अभी तक कोई प्रस्तुति नहीं',
      no_submissions_sub: 'अपना पहला गेम सबमिट करने के लिए नीचे + बटन पर क्लिक करें!',
      my_apps: 'मेरे ऐप्स',
      new_folder: 'नया फ़ोल्डर',
      folder_name: 'फ़ोल्डर का नाम',
      create: 'बनाएं',
      apps_count: 'ऐप्स',
      no_apps_saved: 'कोई ऐप सहेजा नहीं गया',
      no_apps_saved_sub: 'उन्हें यहाँ देखने के लिए फ़ीड या एक्सप्लोर से ऐप सहेजें।',
      back: 'पीछे',
      folder_empty: 'यह फ़ोल्डर खाली है। उन्हें जोड़ने के लिए ऐप्स को यहाँ खींचें!',
      select_apps: 'शामिल करने के लिए ऐप्स चुनें:',
      privacy_policy: 'गोपनीयता नीति',
      terms_service: 'सेवा की शर्तें',
      faq: 'अक्सर पूछे जाने वाले प्रश्न',
      contact_us: 'संपर्क करें',
      email_support: 'ईमेल सहायता',
      live_chat: 'लाइव चैट',
      vision: 'दृष्टिकोण',
      key_features: 'प्रमुख विशेषताएं',
      zero_install: 'शून्य इंस्टॉलेशन',
      zero_install_sub: 'अपने डिवाइस स्टोरेज को भरे बिना ब्राउज़र से तुरंत ऐप्स चलाएं।',
      multi_tasking: 'मल्टी-टास्किंग',
      multi_tasking_sub: 'हमारे अद्वितीय ZeroOS टास्क स्विचर का उपयोग करके कई ऐप्स के बीच आसानी से स्विच करें।',
      cloud_sync: 'क्लाउड सिंक',
      cloud_sync_sub: 'आपकी प्रोफ़ाइल और सहेजे गए ऐप्स किसी भी डिवाइस पर आपका अनुसरण करते हैं जहाँ आप साइन इन करते हैं।',
      stay_connected: 'जुड़े रहें'
    },
    bn: {
      settings: 'সেটিংস',
      profile_settings: 'প্রোফাইল সেটিংস',
      display_name: 'প্রদর্শন নাম',
      email: 'ইমেল',
      app_preferences: 'অ্যাপ পছন্দসমূহ',
      dark_mode: 'ডার্ক মোড',
      notifications: 'বিজ্ঞপ্তি',
      language: 'ভাষা',
      account: 'অ্যাকাউন্ট',
      sign_out: 'সাইন আউট',
      about: 'জিরোঅ্যাপ সম্পর্কে',
      help: 'সাহায্য এবং সমর্থন',
      save: 'সংরক্ষণ করুন',
      cancel: 'বাতিল করুন',
      edit: 'সম্পাদনা করুন',
      done: 'সম্পন্ন',
      version: 'সংস্করণ',
      faq_title: 'আমরা আপনাকে কীভাবে সাহায্য করতে পারি?',
      faq_sub: 'আমরা এখানে জিরোঅ্যাপের মাধ্যমে আপনাকে গাইড করতে এসেছি',
      about_tagline: 'ওয়েব ওএস-এর ভবিষ্যৎ',
      about_desc: 'জিরোঅ্যাপ একটি উচ্চ-ক্ষমতাসম্পন্ন ওয়েব অপারেটিং সিস্টেম যা আধুনিক যুগের জন্য ডিজাইন করা হয়েছে।',
      home_header: 'আজ আপনি কি করতে চান?',
      games_header: 'আজ আপনি কি খেলতে চান?',
      search_apps: 'অ্যাপ খুঁজুন...',
      search_games: 'গেম খুঁজুন...',
      categories: 'বিভাগ',
      show_all: 'সব দেখান',
      recent_used: 'সম্প্রতি ব্যবহৃত',
      view_all: 'সব দেখুন',
      see_all: 'সব দেখুন',
      all: 'সব',
      apps: 'অ্যাপ',
      explore: 'এক্সপ্লোর করুন',
      discover: 'আবিষ্কার করুন',
      play_now: 'এখনই খেলুন',
      featured: 'বৈশিষ্ট্যযুক্ত',
      suggested: 'প্রস্তাবিত',
      for_you: 'আপনার জন্য',
      recommended: 'আপনার জন্য প্রস্তাবিত',
      all_apps: 'সব অ্যাপ',
      all_games: 'সব গেম',
      no_apps: 'এই বিভাগে এখনো কোনো অ্যাপ নেই',
      no_games: 'এই বিভাগে এখনো কোনো গেম নেই',
      comments_count: 'মন্তব্য',
      leaderboard: 'লিডারবোর্ড',
      developer: 'ডেভেলপার',
      add_comment: 'মন্তব্য যোগ করুন...',
      sign_in: 'সাইন ইন',
      search_anything: 'যেকোনো কিছু খুঁজুন...',
      top_results: 'সেরা ফলাফল',
      more_apps: 'আরও অ্যাপ',
      recent: 'সাম্প্রতিক',
      clear_all: 'সব মুছুন',
      no_recent: 'কোনো সাম্প্রতিক অ্যাপ নেই',
      no_recent_sub: 'আপনার খোলা অ্যাপগুলো এখানে দেখা যাবে',
      today: 'আজ',
      yesterday: 'গতকাল',
      earlier: 'আগে',
      reviews: 'রিভিউ',
      downloads: 'ডাউনলোড',
      everyone: 'সবাই',
      launch_app: 'অ্যাপ চালু করুন',
      save_app: 'অ্যাপ সংরক্ষণ করুন',
      saved: 'সংরক্ষিত',
      about_app: 'এই অ্যাপ সম্পর্কে',
      good_morning: 'সুপ্রভাত',
      good_afternoon: 'শুভ অপরাহ্ণ',
      good_evening: 'শুভ সন্ধ্যা',
      games_nav: 'গেম',
      apps_nav: 'অ্যাপ',
      explore_nav: 'এক্সপ্লোর',
      profile_nav: 'প্রোফাইল',
      close_app: 'অ্যাপ বন্ধ করুন',
      cat_ai: 'এআই',
      cat_kids: 'বাচ্চাদের',
      cat_ecommerce: 'ই-কমার্স',
      cat_business: 'ব্যবসা',
      cat_beauty: 'সৌন্দর্য',
      cat_artdesign: 'শিল্প ও নকশা',
      cat_finance: 'অর্থায়ন',
      cat_education: 'শিক্ষা',
      cat_entertainment: 'বিনোদন',
      cat_tools: 'সরঞ্জাম',
      cat_health: 'স্বাস্থ্য',
      cat_social: 'সামাজিক',
      games_header: 'সর্বশেষ হিট আবিষ্কার করুন',
      comments_count: 'মন্তব্য',
      leaderboard: 'লিডারবোর্ড',
      add_comment: 'একটি মন্তব্য যোগ করুন...',
      pts: 'পয়েন্ট',
      search_games: 'গেম অনুসন্ধান করুন',
      developer: 'ডেভেলপার',
      all_apps: 'সমস্ত অ্যাপস',
      vision_desc: 'ZeroApp একটি বিরামহীন, ক্রস-প্ল্যাটফর্ম ইকোসিস্টেম তৈরির দৃষ্টিভঙ্গি নিয়ে তৈরি করা হয়েছে যেখানে ওয়েব অ্যাপ্লিকেশনগুলি স্থানীয় অ্যাপগুলির মতো নেটিভ মনে হয়। আমরা এমন একটি ভবিষ্যতে বিশ্বাস করি যেখানে আপনাকে প্রতিটি ডিভাইসে শত শত অ্যাপ ইনস্টল করার প্রয়োজন হবে না।',
      zero_install_desc: 'আপনার ডিভাইসের স্টোরেজ ভর্তি না করে ব্রাউজার থেকে তাৎক্ষণিকভাবে অ্যাপগুলি চালান।',
      multi_tasking_desc: 'আমাদের অনন্য জিরোওএস টাস্ক সুইচার ব্যবহার করে অনায়াসে একাধিক অ্যাপের মধ্যে স্যুইচ করুন।',
      cloud_sync_desc: 'আপনার প্রোফাইল এবং সংরক্ষিত অ্যাপগুলি আপনি সাইন ইন করেন এমন যেকোনো ডিভাইসে আপনাকে অনুসরণ করে।',
      faq_1_q: 'ZeroApp কি?',
      faq_1_a: 'ZeroApp হল একটি ওয়েব-ভিত্তিক অপারেটিং সিস্টেম যা আপনাকে কোনো ইনস্টলেশন ছাড়াই একসাথে একাধিক ওয়েব অ্যাপ্লিকেশন চালানোর অনুমতি দেয়।',
      faq_2_q: 'আমি কীভাবে আমার প্রোফাইলে অ্যাপ যোগ করব?',
      faq_2_a: 'আপনি অ্যাপের বিবরণ পৃষ্ঠায় "সংরক্ষণ" বোতামে ক্লিক করে এক্সপ্লোর বা হোম স্ক্রীন থেকে অ্যাপগুলি সংরক্ষণ করতে পারেন।',
      faq_3_q: 'এটি ব্যবহার করা কি বিনামূল্যে?',
      faq_3_a: 'হ্যাঁ, জিরোঅ্যাপ সকল ব্যবহারকারীর জন্য সম্পূর্ণ বিনামূল্যে।',
      faq_4_q: 'আমি কীভাবে আমার নিজের অ্যাপ জমা দেব?',
      faq_4_a: 'আপনি নেভিগেশন বারে "+" বোতামে ক্লিক করে এবং জমা দেওয়ার ফর্মটি পূরণ করে আপনার ওয়েব অ্যাপ জমা দিতে পারেন।',
      profile: 'প্রোফাইল',
      my_submissions: 'আমার জমাগুলি',
      login_required: 'লগইন প্রয়োজন',
      login_sub: 'আপনার জমা দেওয়া গেম এবং অ্যাপগুলি দেখতে এবং ট্র্যাক করতে সাইন ইন করুন।',
      login_review_sub: 'সম্প্রদায়ের সাথে আপনার মতামত শেয়ার করুন এবং আপনার অভিজ্ঞতা রেট করুন।',
      login_signup: 'লগইন / সাইন আপ',
      no_submissions: 'এখনো কোনো জমা নেই',
      no_submissions_sub: 'আপনার প্রথম গেমটি জমা দিতে নিচের + বাটনে ক্লিক করুন!',
      my_apps: 'আমার অ্যাপস',
      new_folder: 'নতুন ফোল্ডার',
      folder_name: 'ফোল্ডার নাম',
      create: 'তৈরি করুন',
      apps_count: 'অ্যাপস',
      no_apps_saved: 'কোনো অ্যাপ সংরক্ষিত নেই',
      no_apps_saved_sub: 'ফিড বা এক্সপ্লোর থেকে অ্যাপগুলি এখানে দেখতে সংরক্ষণ করুন।',
      back: 'পিছনে',
      folder_empty: 'এই ফোল্ডারটি খালি। অ্যাপগুলি যোগ করতে এখানে টানুন!',
      select_apps: 'অন্তর্ভুক্ত করতে অ্যাপগুলি নির্বাচন করুন:',
      privacy_policy: 'গোপনীয়তা নীতি',
      terms_service: 'পরিষেবার শর্তাবলী',
      faq: 'প্রায়শই জিজ্ঞাসিত প্রশ্নাবলী',
      contact_us: 'আমাদের সাথে যোগাযোগ করুন',
      email_support: 'ইমেল সহায়তা',
      live_chat: 'লাইভ চ্যাট',
      vision: 'ভিশন',
      key_features: 'মূল বৈশিষ্ট্যসমূহ',
      zero_install: 'জিরো ইন্সটলেশন',
      zero_install_sub: 'আপনার ডিভাইসের স্টোরেজ ভর্তি না করে ব্রাউজার থেকে তাৎক্ষণিকভাবে অ্যাপগুলি চালান।',
      multi_tasking: 'মাল্টি-টাস্কিং',
      multi_tasking_sub: 'আমাদের অনন্য জিরোওএস টাস্ক সুইচার ব্যবহার করে অনায়াসে একাধিক অ্যাপের মধ্যে স্যুইচ করুন।',
      cloud_sync: 'ক্লাউড সিঙ্ক',
      cloud_sync_sub: 'আপনার প্রোফাইল এবং সংরক্ষিত অ্যাপগুলি আপনি সাইন ইন করেন এমন যেকোনো ডিভাইসে আপনাকে অনুসরণ করে।',
      stay_connected: 'সংযুক্ত থাকুন'
    },
    ar: {
      settings: 'الإعدادات',
      profile_settings: 'إعدادات الملف الشخصي',
      display_name: 'اسم العرض',
      email: 'البريد الإلكتروني',
      app_preferences: 'تفضيلات التطبيق',
      dark_mode: 'الوضع الداكن',
      notifications: 'الإشعارات',
      language: 'اللغة',
      account: 'الحساب',
      sign_out: 'تسجيل الخروج',
      about: 'حول ZeroApp',
      help: 'المساعدة والدعم',
      save: 'حفظ',
      cancel: 'إلغاء',
      edit: 'تعديل',
      done: 'تم',
      version: 'الإصدار',
      faq_title: 'كيف يمكننا مساعدتك؟',
      faq_sub: 'نحن هنا لإرشادك عبر ZeroApp',
      about_tagline: 'مستقبل نظام تشغيل الويب',
      about_desc: 'ZeroApp هو نظام تشغيل ويب عالي الأداء مصمم للعصر الحديث.',
      home_header: 'ماذا تود أن تفعل اليوم؟',
      games_header: 'ماذا تود أن تلعب اليوم؟',
      search_apps: 'البحث عن تطبيقات...',
      search_games: 'البحث عن ألعاب...',
      categories: 'الفئات',
      show_all: 'عرض الكل',
      recent_used: 'استخدم مؤخرا',
      view_all: 'عرض الكل',
      see_all: 'عرض الكل',
      all: 'الكل',
      apps: 'تطبيقات',
      explore: 'استكشاف',
      discover: 'اكتشف',
      play_now: 'العب الآن',
      featured: 'مميز',
      suggested: 'مقترح',
      for_you: 'لك',
      recommended: 'موصى به لك',
      all_apps: 'كل التطبيقات',
      all_games: 'كل الألعاب',
      featured_app: 'التطبيق المميز',
      recommended_for_you: 'موصى به لك',
      trending: 'الرائج',
      featured_apps: 'تطبيقات مميزة',
      hot_right_now: 'الأكثر رواجاً الآن',
      top_pick_for_you: 'أفضل اختيار لك',
      editors_picks: 'اختيارات المحرر',
      popular_apps: 'التطبيقات الشهيرة',
      new_experience: 'تجربة جديدة',
      super_apps: 'تطبيقات سوبر',
      apps_might_like: 'تطبيقات قد تعجبك',
      personalize_recommendations: 'تخصيص التوصيات',
      crowd_favorites: 'المفضلة لدى الجمهور',
      this_month_best: 'الأفضل هذا الشهر',
      featured_game: 'اللعبة المميزة',
      recommended_games: 'ألعاب موصى بها',
      trending_games: 'ألعاب رائجة',
      featured_games: 'ألعاب مميزة',
      popular_games: 'ألعاب شهيرة',
      super_games: 'ألعاب سوبر',
      games_might_like: 'ألعاب قد تعجبك',
      no_apps: 'لا توجد تطبيقات في هذه الفئة بعد',
      no_games: 'لا توجد ألعاب في هذه الفئة بعد',
      comments_count: 'تعليقات',
      leaderboard: 'لوحة المتصدرين',
      developer: 'مطور',
      add_comment: 'أضف تعليقا...',
      sign_in: 'تسجيل الدخول',
      search_anything: 'ابحث عن أي شيء...',
      top_results: 'أفضل النتائج',
      more_apps: 'المزيد من التطبيقات',
      recent: 'الأحدث',
      clear_all: 'مسح الكل',
      no_recent: 'لا توجد تطبيقات حديثة',
      no_recent_sub: 'التطبيقات التي تفتحها ستظهر هنا',
      today: 'اليوم',
      yesterday: 'أمس',
      earlier: 'سابقاً',
      reviews: 'تقييمات',
      downloads: 'تنزيلات',
      everyone: 'للجميع',
      launch_app: 'تشغيل التطبيق',
      save_app: 'حفظ التطبيق',
      saved: 'تم الحفظ',
      about_app: 'عن هذا التطبيق',
      good_morning: 'صباح الخير',
      good_afternoon: 'مساء الخير',
      good_evening: 'مساء الخير',
      games_nav: 'ألعاب',
      apps_nav: 'تطبيقات',
      explore_nav: 'استكشاف',
      profile_nav: 'الملف الشخصي',
      close_app: 'إغلاق التطبيق',
      cat_ai: 'ذكاء اصطناعي',
      cat_kids: 'أطفال',
      cat_ecommerce: 'تجارة إلكترونية',
      cat_business: 'أعمال',
      cat_beauty: 'جمال',
      cat_artdesign: 'فن وتصميم',
      cat_finance: 'مالية',
      cat_education: 'تعليم',
      cat_entertainment: 'ترفيه',
      cat_tools: 'أدوات',
      cat_health: 'صحة',
      cat_social: 'اجتماعي',
      games_header: 'اكتشف أحدث الضربات',
      comments_count: 'تعليقات',
      leaderboard: 'لوحة المتصدرين',
      add_comment: 'أضف تعليقاً...',
      pts: 'نقطة',
      search_games: 'البحث عن ألعاب',
      developer: 'مطور',
      all_apps: 'جميع التطبيقات',
      vision_desc: 'تم بناء ZeroApp برؤية لإنشاء نظام بيئي سلس متعدد المنصات حيث تشعر تطبيقات الويب بأنها أصلية مثل التطبيقات المحلية. نحن نؤمن بمستقبل لا تحتاج فيه إلى تثبيت مئات التطبيقات على كل جهاز.',
      zero_install_desc: 'قم بتشغيل التطبيقات فوراً من المتصفح دون ملء مساحة تخزين جهازك.',
      multi_tasking_desc: 'بدّل بين تطبيقات متعددة بسهولة باستخدام مبدل مهام ZeroOS الفريد.',
      cloud_sync_desc: 'يتبعك ملفك الشخصي وتطبيقاتك المحفوظة عبر أي جهاز تسجل الدخول فيه.',
      faq_1_q: 'ما هو ZeroApp؟',
      faq_1_a: 'ZeroApp هو نظام تشغيل قائم على الويب يتيح لك تشغيل العديد من تطبيقات الويب في وقت واحد دون أي تثبيت.',
      faq_2_q: 'كيف أضيف تطبيقات إلى ملفي الشخصي؟',
      faq_2_a: 'يمكنك حفظ التطبيقات من شاشات الاستكشاف أو الصفحة الرئيسية بالنقر فوق الزر "حفظ" في صفحة تفاصيل التطبيق.',
      faq_3_q: 'هل هو مجاني للاستخدام؟',
      faq_3_a: 'نعم ، ZeroApp مجاني تماماً لجميع المستخدمين.',
      faq_4_q: 'كيف يمكنني تقديم تطبيقي الخاص؟',
      faq_4_a: 'يمكنك تقديم تطبيق الويب الخاص بك عن طريق النقر فوق الزر "+" في شريط التنقل وملء نموذج التقديم.',
      profile: 'الملف الشخصي',
      my_submissions: 'مساهماتي',
      login_required: 'تسجيل الدخول مطلوب',
      login_sub: 'سجل دخولك لعرض وتتبع الألعاب والتطبيقات التي قمت بتقديمها.',
      login_signup: 'تسجيل الدخول / الاشتراك',
      no_submissions: 'لا توجد مساهمات بعد',
      no_submissions_sub: 'انقر فوق الزر + أدناه لتقديم أول لعبة لك!',
      my_apps: 'تطبيقاتي',
      new_folder: 'مجلد جديد',
      folder_name: 'اسم المجلد',
      create: 'إنشاء',
      apps_count: 'تطبيقات',
      no_apps_saved: 'لا توجد تطبيقات محفوظة',
      no_apps_saved_sub: 'احفظ التطبيقات من الخلاصة أو الاستكشاف لتراها هنا.',
      back: 'رجوع',
      folder_empty: 'هذا المجلد فارغ. اسحب التطبيقات هنا لإضافتها!',
      select_apps: 'حدد التطبيقات المراد تضمينها:',
      privacy_policy: 'سياسة الخصوصية',
      terms_service: 'شروط الخدمة',
      faq: 'الأسئلة الشائعة',
      contact_us: 'اتصل بنا',
      email_support: 'دعم البريد الإلكتروني',
      live_chat: 'دردشة مباشرة',
      vision: 'الرؤية',
      key_features: 'الميزات الرئيسية',
      zero_install: 'بدون تثبيت',
      zero_install_sub: 'قم بتشغيل التطبيقات فوراً من المتصفح دون ملء مساحة تخزين جهازك.',
      multi_tasking: 'تعدد المهام',
      multi_tasking_sub: 'بدّل بين تطبيقات متعددة بسهولة باستخدام مبدل مهام ZeroOS الفريد.',
      cloud_sync: 'مزامنة سحابية',
      cloud_sync_sub: 'يتبعك ملفك الشخصي وتطبيقاتك المحفوظة عبر أي جهاز تسجل الدخول فيه.',
      stay_connected: 'ابق على اتصال'
    },
  };

  const t = useCallback((key) => {
    return translations[lang]?.[key] || translations['en']?.[key] || key;
  }, [lang]);

  useEffect(() => {
    document.documentElement.className = theme === 'light' ? 'light-mode' : '';
  }, []);

  const [tasks, setTasks] = useState([]); // { id, app, status: 'active'|'minimized' }
  const [activeTaskId, setActiveTaskId] = useState(null);

  // ── Real-time Catalog Logic ──
  useEffect(() => {
    if (!supabase) return;

    const fetchAll = async () => {
      const [a, g, c, s, p] = await Promise.all([
        supabase.from('apps').select('*'),
        supabase.from('games').select('*'),
        supabase.from('categories').select('*'),
        supabase.from('settings').select('*'),
        supabase.from('promotions').select('*')
      ]);

      if (a.data) setRawApps(a.data);
      if (g.data) setRawGames(g.data);
      if (c.data && c.data.length > 0) { setLiveCats(c.data); window.liveCats = c.data; }
      if (p.data) setPromotions(p.data);

      if (s.data && s.data.length > 0) {
        const sMap = {};
        s.data.forEach(item => sMap[item.key] = item.value);
        setSettings(sMap);
        window.appSettings = sMap;
      }
    };
    fetchAll();

    const channel = supabase.channel('catalog_changes')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => fetchAll())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // ── Dynamic Filtering (Region Based) ──
  useEffect(() => {
    const filter = (list) => list.filter(item => {
      // 1. Status Check (for database items)
      if (item.status && item.status !== 'approved') return false;

      // 2. Region Check
      // Rule: USA or Global should show on USA. Pakistan should only be visible in Pakistan.
      // Logic: (item.region === userRegion || item.region === 'Global' || !item.region)
      const matchesRegion = (item.region === userRegion || item.region === 'Global' || !item.region);
      
      return matchesRegion;
    });

    const sourceApps = rawApps.length > 0 ? rawApps : (typeof APPS !== 'undefined' ? APPS : []);
    const sourceGames = rawGames.length > 0 ? rawGames : (typeof GAMES !== 'undefined' ? GAMES : []);

    const approvedApps = filter(sourceApps);
    const approvedGames = filter(sourceGames);

    setLiveApps(approvedApps);
    window.liveApps = approvedApps;
    
    setLiveGames(approvedGames);
    window.liveGames = approvedGames;
  }, [rawApps, rawGames, userRegion]);

  // ── Smart Recommendations ──
  const getSmartRecommendations = useCallback((type = 'app') => {
    const pool = type === 'game' ? liveGames : liveApps;
    if (pool.length === 0) return [];

    // 1. Collect user interests (tags from saved apps and recents)
    const saved = pool.filter(a => savedApps.includes(a.id));
    const recent = pool.filter(a => recents.some(r => r.id === a.id));
    
    const userTags = new Set();
    [...saved, ...recent].forEach(a => {
      if (Array.isArray(a.tags)) a.tags.forEach(t => userTags.add(t.toLowerCase()));
    });

    if (userTags.size === 0) return pool.slice(0, 10); // Fallback to first few

    // 2. Score apps based on tag matches
    const scored = pool.map(app => {
      let score = 0;
      if (Array.isArray(app.tags)) {
        app.tags.forEach(t => {
          if (userTags.has(t.toLowerCase())) score += 1;
        });
      }
      // Boost highly rated apps slightly
      score += (app.rating || 0) / 10;
      return { ...app, _score: score };
    });

    // 3. Filter out already saved/recent apps from the "For You" list
    const excludeIds = new Set([...savedApps, ...recents.map(r => r.id)]);
    
    return scored
      .filter(a => !excludeIds.has(a.id))
      .sort((a, b) => b._score - a._score)
      .slice(0, 10);
  }, [liveApps, liveGames, savedApps, recents]);

  // ── Analytics & Identity Logic ──
  const logActivity = useCallback(async (action, itemId = null, metadata = {}) => {
    if (!supabase) return;
    const entry = {
      action,
      item_id: itemId ? String(itemId) : null,
      user_id: user?.id || null,
      metadata
    };
    await supabase.from('activity_log').insert(entry);
  }, [supabase, user]);

  const uploadAvatar = useCallback(async (file) => {
    if (!supabase || !user) return { error: 'Login required' };
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${Math.random()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    // 1. Upload to Storage
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file);

    if (uploadError) return { error: uploadError };

    // 2. Get Public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    // 3. Update Profile
    const { error: updateError } = await supabase
      .from('profiles')
      .upsert({ id: user.id, avatar_url: publicUrl, updated_at: new Date() });

    if (updateError) return { error: updateError };
    
    // Refresh user profile state
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    setUserProfile(profile);

    return { publicUrl };
  }, [supabase, user]);

  // ── Social Logic ──
  const fetchComments = useCallback(async (itemId) => {
    if (!supabase) return [];
    // Join with profiles to get display_name
    const { data, error } = await supabase
      .from('comments')
      .select('*, profile:profiles(display_name, avatar_url)')
      .eq('item_id', itemId)
      .order('created_at', { ascending: false });
    if (error) { console.error('Error fetching comments:', error); return []; }
    return data;
  }, [supabase]);

  const postComment = useCallback(async (itemId, content) => {
    if (!supabase || !user) return { error: 'Login required' };
    const { data, error } = await supabase
      .from('comments')
      .insert({ item_id: itemId, user_id: user.id, content })
      .select('*, profile:profiles(display_name, avatar_url)')
      .single();
    return { data, error };
  }, [supabase, user]);

  const submitRating = useCallback(async (itemId, stars) => {
    if (!supabase || !user) return { error: 'Login required' };
    const { data, error } = await supabase
      .from('ratings')
      .upsert({ item_id: itemId, user_id: user.id, stars }, { onConflict: 'item_id,user_id' });
    return { data, error };
  }, [supabase, user]);

  const fetchScores = useCallback(async (gameId) => {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('leaderboards')
      .select('*, profile:profiles(display_name, avatar_url)')
      .eq('game_id', gameId)
      .order('score', { ascending: false })
      .limit(10);
    if (error) { console.error('Error fetching scores:', error); return []; }
    return data;
  }, [supabase]);

  const postScore = useCallback(async (gameId, score, metadata = {}) => {
    if (!supabase || !user) return { error: 'Login required' };
    const { data, error } = await supabase
      .from('leaderboards')
      .insert({ game_id: gameId, user_id: user.id, score, metadata });
    return { data, error };
  }, [supabase, user]);

  // ── Love / React Logic ──
  const toggleLove = useCallback(async (itemId) => {
    if (!supabase || !user) return { error: 'Login required' };
    // Check if already loved
    const { data: existing } = await supabase
      .from('loves')
      .select('id')
      .eq('item_id', itemId)
      .eq('user_id', user.id)
      .maybeSingle();
    if (existing) {
      const { error } = await supabase.from('loves').delete().eq('id', existing.id);
      return { loved: false, error };
    } else {
      const { error } = await supabase.from('loves').insert({ item_id: itemId, user_id: user.id });
      return { loved: true, error };
    }
  }, [supabase, user]);

  const fetchLoves = useCallback(async (itemId) => {
    if (!supabase) return { count: 0, loved: false };
    const { count } = await supabase
      .from('loves')
      .select('id', { count: 'exact', head: true })
      .eq('item_id', itemId);
    let loved = false;
    if (user) {
      const { data } = await supabase
        .from('loves')
        .select('id')
        .eq('item_id', itemId)
        .eq('user_id', user.id)
        .maybeSingle();
      loved = !!data;
    }
    return { count: count || 0, loved };
  }, [supabase, user]);

  // ── URL Helpers ──
  const getUrlForFrame = useCallback((frame) => {
    if (!frame) return '#apps';
    let url = '#' + frame.id;
    const params = frame.params || {};
    const query = [];
    if (params.detailApp) query.push(`id=${params.detailApp.id || params.detailApp}`);
    else if (params.viewerApp) query.push(`id=${params.viewerApp.id || params.viewerApp}`);
    else if (params.exploreCategory) query.push(`id=${params.exploreCategory}`);
    else if (frame.id === 'search' && searchQ) query.push(`q=${encodeURIComponent(searchQ)}`);

    return query.length > 0 ? `${url}?${query.join('&')}` : url;
  }, [searchQ]);

  // ── Navigate ──
  const go = useCallback((s, extra = {}) => {
    const isRootTab = ['apps', 'games', 'explore', 'profile'].includes(s);
    const key = s + '-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    const frame = { key, id: s, params: extra };

    setHistory(h => {
      // If switching to a main tab, reset the stack to keep performance high
      // and prevent multiple bottom-navs from overlapping.
      if (isRootTab) {
        const next = [frame];
        // If we are already on this screen, just replace state; otherwise push.
        if (h[h.length - 1].id === s) {
          window.history.replaceState({ stackIndex: 0 }, '', getUrlForFrame(frame));
        } else {
          window.history.pushState({ stackIndex: 0 }, '', getUrlForFrame(frame));
        }
        return next;
      }

      const next = [...h, frame];
      window.history.pushState({ stackIndex: next.length - 1 }, '', getUrlForFrame(frame));
      return next;
    });
  }, [getUrlForFrame]);

  const goBack = useCallback((fromPopState = false) => {
    setHistory(h => {
      if (h.length <= 1) {
        // If we're at the root and user hits back, we can't pop React history
        // But if it's from browser back, we should at least check if we can sync
        return h;
      }
      if (!fromPopState) window.history.back();
      const next = [...h];
      next.pop();
      return next;
    });
  }, []);

  // ── Browser History Sync ──
  useEffect(() => {
    const handlePop = (e) => {
      const hash = window.location.hash;
      const [idPart] = (hash.slice(1) || 'apps').split('?');

      setHistory(h => {
        // If the browser went back and the current hash matches the PREVIOUS screen in our stack, pop it.
        if (h.length > 1 && h[h.length - 2].id === idPart) {
          const next = [...h];
          next.pop();
          return next;
        }
        // Otherwise, if the browser is at a completely different root, re-hydrate.
        if (['apps', 'games', 'explore', 'profile'].includes(idPart)) {
          // Resolve extra params if needed... for now just reset to that root
          return [{ key: 'pop-' + Date.now(), id: idPart, params: {} }];
        }
        return h;
      });
    };
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, []);

  // ── Initial Hydration ──
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash || hash === '#apps') return;

    const [idPart, queryPart] = hash.slice(1).split('?');
    const params = {};
    if (queryPart) {
      queryPart.split('&').forEach(p => {
        const [k, v] = p.split('=');
        params[k] = decodeURIComponent(v);
      });
    }

    // Prepare the hydration frame
    let frameId = idPart;
    let extra = {};
    if (frameId === 'detail' && params.id) extra = { detailApp: params.id };
    else if (frameId === 'explore' && params.id) extra = { exploreCategory: params.id };
    else if (frameId === 'viewer' && params.id) extra = { viewerApp: params.id };
    else if (frameId === 'search' && params.q) {
      extra = {};
      setSearchQ(params.q);
    }

    // Boot with Home + the Deep Link screen so "back" works
    setHistory([
      { key: 'root-apps', id: 'apps', params: {} },
      { key: 'deep-link-' + Date.now(), id: frameId, params: extra }
    ]);

    // Replace current state so browser knows we are at index 1
    window.history.replaceState({ stackIndex: 1 }, '', hash);
  }, []);

  const goHome = useCallback(() => {
    setHistory([{ key: 'root-apps', id: 'apps', params: {} }]);
    setMainTab('apps');
    setSearchQ('');
  }, []);

  // ── Open app detail ──
  const openDetail = useCallback((app) => {
    logActivity('detail_view', app.id, { name: app.name });
    go('detail', { detailApp: app });
  }, [logActivity]);

  // ── Multi-tasking Logic ──
  const launchApp = useCallback((app) => {
    if (!app || !app.url) return;

    logActivity('app_open', app.id, { name: app.name });

    setTasks(prev => {
      // Check if already running
      const existing = prev.find(t => t.id === app.id);
      if (existing) {
        setActiveTaskId(app.id);
        return prev.map(t => t.id === app.id ? { ...t, status: 'active' } : { ...t, status: 'minimized' });
      }
      // Add new task
      const newTask = { id: app.id, app, status: 'active' };
      setActiveTaskId(app.id);
      return [...prev.map(t => ({ ...t, status: 'minimized' })), newTask];
    });

    // Add to recents
    setRecents(prev => {
      const next = [{ ...app, openedAt: Date.now() }, ...prev.filter(r => r.id !== app.id)].slice(0, 20);
      lsSet('zero_recents', next);
      return next;
    });
  }, []);

  const minimizeTask = useCallback((id) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: 'minimized' } : t));
    setActiveTaskId(null);
  }, []);

  const closeTask = useCallback((id) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    setActiveTaskId(prev => prev === id ? null : prev);
  }, []);

  const switchTask = useCallback((id) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: 'active' } : { ...t, status: 'minimized' }));
    setActiveTaskId(id);
  }, []);



  // ── Saved Apps ──
  const toggleSaveApp = useCallback((app) => {
    setSavedApps(prev => {
      const has = prev.find(s => s.id === app.id);
      if (has) {
        // If un-saving, also remove from any folders
        setFolders(oldFolders => {
          const nextFolders = oldFolders.map(f => ({ ...f, appIds: f.appIds.filter(id => id !== app.id) }));
          lsSet('zero_folders', nextFolders);
          return nextFolders;
        });
      }
      const next = has ? prev.filter(s => s.id !== app.id) : [app, ...prev];
      lsSet('zero_saved_apps', next);
      return next;
    });
  }, []);
  const isSaved = useCallback((id) => savedApps.some(s => s.id === id), [savedApps]);

  // ── Folders ──
  const createFolder = useCallback((name, appIds = []) => {
    setFolders(prev => {
      // Ensure apps can only exist in one folder at a time:
      // Remove these appIds from all existing folders first.
      const cleaned = prev.map(f => ({
        ...f,
        appIds: f.appIds.filter(id => !appIds.includes(id))
      }));
      const next = [{ id: 'f_' + Date.now(), name, appIds }, ...cleaned];
      lsSet('zero_folders', next);
      return next;
    });
  }, []);

  const moveAppToFolder = useCallback((appId, targetFolderId) => {
    setFolders(prev => {
      // Remove from all folders first
      let next = prev.map(f => ({ ...f, appIds: f.appIds.filter(id => id !== appId) }));
      // Add to target folder
      next = next.map(f => {
        if (f.id === targetFolderId && !f.appIds.includes(appId)) {
          return { ...f, appIds: [...f.appIds, appId] };
        }
        return f;
      });
      lsSet('zero_folders', next);
      return next;
    });
  }, []);

  const removeAppFromFolder = useCallback((appId, folderId) => {
    setFolders(prev => {
      const next = prev.map(f => {
        if (f.id === folderId) return { ...f, appIds: f.appIds.filter(id => id !== appId) };
        return f;
      });
      lsSet('zero_folders', next);
      return next;
    });
  }, []);

  const deleteFolder = useCallback((folderId) => {
    setFolders(prev => {
      const next = prev.filter(f => f.id !== folderId);
      lsSet('zero_folders', next);
      return next;
    });
  }, []);

  // ── Clear recents ──
  const clearRecents = useCallback(() => { setRecents([]); lsSet('zero_recents', []); }, []);

  const greeting = useMemo(() => {
    const hr = new Date().getHours();
    let key = 'good_evening';
    if (hr < 12) key = 'good_morning';
    else if (hr < 18) key = 'good_afternoon';

    const timeGreeting = t(key);

    if (userProfile && userProfile.display_name) {
      return `${timeGreeting}, ${userProfile.display_name.split(' ')[0]}`;
    }
    return timeGreeting;
  }, [userProfile, t]);

  const getPromoItems = useCallback((categoryKey, type = 'app') => {
    const now = new Date();
    const sectionPromos = promotions.filter(p => 
      p.category_key === categoryKey && 
      p.item_type === type &&
      p.is_active !== false &&
      (p.region === userRegion || p.region === 'Global') &&
      (!p.start_date || new Date(p.start_date) <= now) &&
      (!p.end_date || new Date(p.end_date) >= now)
    );

    if (sectionPromos.length > 0) {
      const dataSet = type === 'app' ? liveApps : liveGames;
      return sectionPromos
        .map(p => dataSet.find(it => it.id === p.item_id))
        .filter(Boolean);
    }
    return null;
  }, [promotions, userRegion, liveApps, liveGames]);

  const value = {
    supabase,
    session, user, signIn, signUp, signOut, signInWithGoogle,
    screen, history, go, goBack, goHome,
    mainTab, setMainTab,
    openDetail, launchApp,
    tasks, setTasks, activeTaskId, setActiveTaskId,
    minimizeTask, closeTask, switchTask,
    searchQ, setSearchQ,
    recents, clearRecents,
    savedApps, folders, toggleSaveApp, isSaved,
    createFolder, moveAppToFolder, removeAppFromFolder, deleteFolder,
    liveApps, liveGames, liveCats, settings,
    greeting,
    userProfile,
    updateProfileName,
    t, lang, setLang, theme, setTheme,
    userRegion, setUserRegion, promotions, getPromoItems,
    fetchComments, postComment, submitRating, fetchScores, postScore,
    toggleLove, fetchLoves,
    getSmartRecommendations,
    recentSearches, updateSearchHistory, clearSearchHistory,
    logActivity, uploadAvatar
  };

  return React.createElement(Ctx.Provider, { value }, children);
}
