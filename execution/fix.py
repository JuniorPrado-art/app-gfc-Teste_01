import os
import glob

# 1. Update app.py host
app_py_path = 'app.py'
with open(app_py_path, 'r', encoding='utf-8') as f:
    app_py = f.read()

if 'app.run(debug=True, port=5000)' in app_py:
    app_py = app_py.replace('app.run(debug=True, port=5000)', "app.run(host='0.0.0.0', debug=True, port=5000)")
    with open(app_py_path, 'w', encoding='utf-8') as f:
        f.write(app_py)
    print('app.py atualizado')

# 2. Update frontend files
frontend_dir = r'C:\Users\Milton Prado\Documents\App-GFC\frontend\src'
files = glob.glob(frontend_dir + '/**/*.tsx', recursive=True)

count = 0
for file in files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if 'http://127.0.0.1:5000' in content:
        # We need to replace fetch('http://127.0.0.1:5000/api/endpoint')
        # with fetch(`http://${window.location.hostname}:5000/api/endpoint`)
        
        # Simple string replacement for all exact matches
        # 1. Replace the starting single quote of the url with backtick and the IP with the dynamic variable
        content = content.replace("'http://127.0.0.1:5000", "`http://${window.location.hostname}:5000")
        
        # 2. Re-replace the ending single quote for all known endpoints
        content = content.replace("5000/api/config/test'", "5000/api/config/test`")
        content = content.replace("5000/api/config/save'", "5000/api/config/save`")
        content = content.replace("5000/api/config/load'", "5000/api/config/load`")
        content = content.replace("5000/api/auth/login'", "5000/api/auth/login`")
        content = content.replace("5000/api/config/visibility'", "5000/api/config/visibility`")
        content = content.replace("5000/api/monitoramento/prevendas'", "5000/api/monitoramento/prevendas`")
        content = content.replace("5000/api/monitoramento/sincronia'", "5000/api/monitoramento/sincronia`")
        
        with open(file, 'w', encoding='utf-8') as f:
            f.write(content)
        count += 1

print(f'{count} arquivos do frontend atualizados')
