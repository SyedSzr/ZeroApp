import urllib.request
req = urllib.request.Request("https://sjotifqahfcylcooaqxm.supabase.co/rest/v1/profiles?select=*", headers={"apikey": "sb_publishable_3h4-HTzlMANQA-T2FMaavQ_uso2rIGj", "Authorization": "Bearer sb_publishable_3h4-HTzlMANQA-T2FMaavQ_uso2rIGj"})
try:
    with urllib.request.urlopen(req) as response:
        print(response.read().decode())
except Exception as e:
    print(e)
