$pythonInstallerUrl = "https://www.python.org/ftp/python/3.11.9/python-3.11.9-amd64.exe"
$installerPath = "C:\Users\Welcome\Downloads\python_installer.exe"

Write-Host "Downloading Python 3.11.9..."
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
Invoke-WebRequest -Uri $pythonInstallerUrl -OutFile $installerPath

Write-Host "Installing Python silently..."
$process = Start-Process -FilePath $installerPath -ArgumentList "/quiet InstallAllUsers=0 PrependPath=1 Include_test=0" -Wait -PassThru

if ($process.ExitCode -eq 0) {
    Write-Host "Python installed successfully!"
} else {
    Write-Host "Python installation failed with exit code $($process.ExitCode)."
}
