$bytes = [System.IO.File]::ReadAllBytes('icons/iqbal_logo.jpg')
$b64 = [Convert]::ToBase64String($bytes)
$svg = @"
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 225 225" width="225" height="225">
  <rect width="225" height="225" fill="#FFFFFF" rx="16"/>
  <image href="data:image/jpeg;base64,$b64" width="225" height="225" preserveAspectRatio="xMidYMid meet"/>
</svg>
"@
[System.IO.File]::WriteAllText('icons/logo.svg', $svg)
[System.IO.File]::WriteAllText('icons/favicon.svg', $svg)
Write-Output "Embedded exact logo into logo.svg and favicon.svg successfully!"
