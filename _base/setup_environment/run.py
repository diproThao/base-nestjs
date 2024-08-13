from dotenv import load_dotenv
load_dotenv()
import os
from urllib.parse import urlencode
import boto3
import requests
from helper import execute
import time

aws_access_key = os.getenv('AWS_ACCESS_KEY')
aws_secret_key = os.getenv('AWS_SECRET_KEY')
aws_region = os.getenv('AWS_REGION')
git_personal_token = os.getenv('GITLAB_PERSONAL_TOKEN')
gitlab_project_id = os.getenv('GITLAB_PROJECT_ID')
prefix = os.getenv('PREFIX') or 'dev'
private_port_dev = os.getenv('PRIVATE_PORT_DEV')
private_port_uat = os.getenv('PRIVATE_PORT_UAT')
domain_dev = os.getenv('DOMAIN_DEV')
domain_uat = os.getenv('DOMAIN_UAT')

if private_port_dev == private_port_uat:
    raise Exception('Private Port DEV and UAT is Same')



# ---------------------------------------------------------
session = boto3.Session(
    aws_access_key_id= aws_access_key,
    aws_secret_access_key= aws_secret_key,
    region_name=aws_region
)

lightsail_client = session.client('lightsail')
# ---------------------------------------------------------

def create_instance(instanceName: str):
 
    instance = lightsail_client.create_instances(
            instanceNames=[instanceName],
            availabilityZone=f'{aws_region}a',
            blueprintId='ubuntu_18_04',
            bundleId='small_2_0',
            userData=f"""
            apt update -y
            curl -sL https://deb.nodesource.com/setup_14.x | sudo bash -
            apt -y install nodejs
            npm i -g pm2 yarn
            apt -y install nginx
            echo "Done" > /home/ubuntu/done
            """,
            ipAddressType='ipv4'
        )
    print(instance)

def download_key_pair():
    response = lightsail_client.download_default_key_pair()
    return response.get('publicKeyBase64'), response.get('privateKeyBase64')

def get_instance_public_ip(instanceName):
    response = lightsail_client.get_instance(instanceName=instanceName)
    instance = response.get('instance')
    return instance.get('publicIpAddress', '')

def write_to_file(path, content):
    f = open(path, 'w')
    f.write(content)
    f.close()

def make_gitlab_ci():
    return f"""
stages:
    - dev_build
    - uat_build

variables:
    SSH_SERVER_DEV: ssh -i ./key-{gitlab_project_id}.pem -o StrictHostKeyChecking=no $DEV_SERVER
    SSH_SERVER_UAT: ssh -i ./key-{gitlab_project_id}.pem -o StrictHostKeyChecking=no $UAT_SERVER

dev_build:
    stage: dev_build
    script:
        - cp $DEV_PEM ./key-{gitlab_project_id}.pem && chmod 400 ./key-{gitlab_project_id}.pem
        - scp -i ./key-{gitlab_project_id}.pem -o StrictHostKeyChecking=no $DEV_ENV $DEV_SERVER:$DEV_DIR
        - echo $SSH_SERVER_DEV
        - $SSH_SERVER_DEV "cd $DEV_DIR && git checkout -f dev && git pull && cp DEV_ENV .env"
        - $SSH_SERVER_DEV "cd $DEV_DIR && yarn && yarn build:prod"
        - $SSH_SERVER_DEV "cd $DEV_DIR && pm2 start processes.dev.json"
    only:
        - dev

uat_build:
    stage: uat_build
    script:
        - cp $UAT_PEM ./key-{gitlab_project_id}.pem && chmod 400 ./key-{gitlab_project_id}.pem
        - scp -i ./key-{gitlab_project_id}.pem -o StrictHostKeyChecking=no $UAT_ENV $UAT_SERVER:$UAT_DIR
        - echo $SSH_SERVER_UAT
        - $SSH_SERVER_UAT "cd $UAT_DIR && git checkout -f main && git pull && cp UAT_ENV .env"
        - $SSH_SERVER_UAT "cd $UAT_DIR && yarn && yarn build:prod"
        - $SSH_SERVER_UAT "cd $UAT_DIR && pm2 start processes.uat.json"
    only:
        - main
"""

def make_nginx_config(domain, private_port):
    return f"""
server  {{
    listen  80;

    server_name {domain};

    location / {{
        proxy_pass http://localhost:{private_port};
    }}
}}
"""
# ---------------------------------------------------------

GIT_LAB_END_POINT = 'https://gitlab.com/api/v4'

def make_url(path: str, query: dict = {}) -> str:
    return f"{GIT_LAB_END_POINT}/{path}?{urlencode(query)}"

def make_headers_token(token: str) -> dict:
    return {"PRIVATE-TOKEN": token}

# ---------------------------------------------------------

def get_git_url():
    url = make_url(f'/projects/{gitlab_project_id}')
    response = requests.get(url,headers=make_headers_token(git_personal_token))
    return response.json().get('http_url_to_repo')

def create_pem_file_variable_git(key, content):
    url = make_url(f'/projects/{gitlab_project_id}/variables')
    form_data = {
        'key': key,
        'value': content,
        'variable_type': 'file',
    }

    server = requests.post(url,headers=make_headers_token(git_personal_token), data=form_data)
    print(server)

def create_variable_git(key, value):
    url = make_url(f'/projects/{gitlab_project_id}/variables')
    form_data = {
        'key': key,
        'value': value,
        'variable_type': 'env_var',
    }

    server = requests.post(url,headers=make_headers_token(git_personal_token), data=form_data)
    print(server)

def make_dev_env(publicIp, privateKeyBase64, gitUrl):

    DEV_DIR = '/home/ubuntu/dev'

    create_pem_file_variable_git("DEV_PEM",privateKeyBase64)
    create_variable_git(key='DEV_DIR', value=DEV_DIR)
    create_pem_file_variable_git("DEV_ENV","")
    create_variable_git(key='DEV_SERVER', value=f'ubuntu@{publicIp}')

    clone_source_cmd = f'git clone {gitUrl.replace("https://", f"https://oauth2:{git_personal_token}@")} {DEV_DIR}'
    execute(privateKeyBase64, publicIp, clone_source_cmd)

    print('\n-----------------------------\n')
    print('Modify Nginx Config')
    config_nginx_cmd = f"echo '{make_nginx_config(domain_dev, private_port_dev)}' | sudo tee /etc/nginx/sites-enabled/dev"
    execute(privateKeyBase64, publicIp, config_nginx_cmd)

def make_uat_env(publicIp, privateKeyBase64, gitUrl):

    UAT_DIR = '/home/ubuntu/uat'

    create_pem_file_variable_git("UAT_PEM",privateKeyBase64)
    create_variable_git(key='UAT_DIR', value=UAT_DIR)
    create_pem_file_variable_git("UAT_ENV","")
    create_variable_git(key='UAT_SERVER', value=f'ubuntu@{publicIp}')

    clone_source_cmd = f'git clone {gitUrl.replace("https://", f"https://oauth2:{git_personal_token}@")} {UAT_DIR}'
    execute(privateKeyBase64, publicIp, clone_source_cmd)

    print('\n-----------------------------\n')
    print('Modify Nginx Config')
    config_nginx_cmd = f"echo '{make_nginx_config(domain_uat, private_port_uat)}' | sudo tee /etc/nginx/sites-enabled/uat"
    execute(privateKeyBase64, publicIp, config_nginx_cmd)

def is_run_launch_scrip_done():
    command_ = 'ls /home/ubuntu | grep done'
    try:
        log = execute(privateKeyBase64, publicIp, command_)
    except:
        print('is_run_launch_scrip_done::Error, retry after 5s')

    return 'done' in log

if __name__ == '__main__':
    if not os.path.exists(gitlab_project_id):
        os.makedirs(gitlab_project_id)

    publicKeyBase64, privateKeyBase64  = download_key_pair()

    instanceName = f"{prefix}-{gitlab_project_id}"

    create_instance(instanceName)
    
    info = f"""
    instanceName: {instanceName}
    awsRegion: {aws_region}
    """
    write_to_file(f'./{gitlab_project_id}/key.pem', privateKeyBase64)
    write_to_file(f'./{gitlab_project_id}/info',info)
    write_to_file(f'./{gitlab_project_id}/.gitlab-ci.yml',make_gitlab_ci())
    write_to_file(f'./{gitlab_project_id}/nginx_dev',make_nginx_config(domain_dev, private_port_dev))
    write_to_file(f'./{gitlab_project_id}/nginx_dev',make_nginx_config(domain_uat, private_port_uat))
    
    print('Step 1: Done !!!')

    publicIp = ''
    print('\n-----------------------------\n')
    print('Get Instance Ip')

    while True:
        publicIp = get_instance_public_ip(instanceName)
        if publicIp:
            print(f'\tip: {publicIp}')
            break
        time.sleep(5)

    instanceName = f"{prefix}-{gitlab_project_id}"

    gitUrl = get_git_url()

    print('\n-----------------------------\n')
    print('Check run launch script state')

    while True:
        if is_run_launch_scrip_done():
            break
        time.sleep(5)

    make_dev_env(publicIp, privateKeyBase64, gitUrl)
    make_uat_env(publicIp, privateKeyBase64, gitUrl)
    restart_nginx_config = f"sudo systemctl restart nginx"
    execute(privateKeyBase64, publicIp, restart_nginx_config)

    print('\nStep 2: Done !!!')
