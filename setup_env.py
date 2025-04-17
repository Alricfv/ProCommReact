import os
import subprocess
import sys

def ensure_virtual_environment():
    if not hasattr(sys, 'real_prefix') and sys.base_prefix == sys.prefix:
        print("Virtual environment not active. Activating...")
        activate_script = os.path.join('venv', 'Scripts', 'activate_this.py')
        with open(activate_script) as file:
            exec(file.read(), {'__file__': activate_script})

def install_requirements():
    print("Installing requirements...")
    subprocess.check_call([sys.executable, '-m', 'pip', 'install', '-r', 'Requirements.txt'])

if __name__ == "__main__":
    ensure_virtual_environment()
    install_requirements()