Remove-Item -Path "/mnt/c/inetpub/wwwroot/*" -Recurse -Force

Copy-Item -Path "/root/github/pinball-wizard/dist/*" -Destination "/mnt/c/inetpub/wwwroot/" -Recurse -Force
Copy-Item -Path "/root/github/pinball-wizard/iis/container.html" -Destination "/mnt/c/inetpub/wwwroot/" -Force
Copy-Item -Path "/root/github/pinball-wizard/iis/e9e5feea23539ef2.css" -Destination "/mnt/c/inetpub/wwwroot/" -Force