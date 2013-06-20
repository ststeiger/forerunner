param (
  [string] $ConfigFile,
  [string] $Subject,
  [string] $Body,
  [string] $BodyFile,
  [switch] $BodyAsHtml,
  [string[]] $Attachments
)
try {
  [xml]$Config = [xml](gc $ConfigFile)
  $emailFrom = $Config.SmtpConfiguration.From 
  $emailTo = $Config.SmtpConfiguration.To
  $smtpServer = $Config.SmtpConfiguration.Server
  $cred = $null
  [bool]$useSsl = [bool]$Config.SmtpConfiguration.UseSsl

  if($BodyFile) {
    $Body = (gc $BodyFile | out-string)
  }

  $MaxRetryCount = 10

  foreach($retry in 0..$MaxRetryCount) {
    if($Config.SmtpConfiguration.UserName) {
      $userName = $Config.SmtpConfiguration.UserName
      $password = ConvertTo-SecureString -AsPlainText -Force -String $Config.SmtpConfiguration.Password
      $cred = new-object System.Management.Automation.PSCredential $userName,$password
      if($Attachments) {
        Send-MailMessage -To $emailTo -Subject $Subject -From -$emailFrom -SmtpServer $smtpServer -Body $Body -UseSsl:$useSsl -Credential $cred -BodyAsHtml:$BodyAsHtml -Attachments $Attachments -ErrorVariable SendMailError
      } else {
        Send-MailMessage -To $emailTo -Subject $Subject -From -$emailFrom -SmtpServer $smtpServer -Body $Body -UseSsl:$useSsl -Credential $cred -BodyAsHtml:$BodyAsHtml -ErrorVariable SendMailError
      }
    } else {
      if($Attachments) {
        Send-MailMessage -To $emailTo -Subject $Subject -From -$emailFrom -SmtpServer $smtpServer -Body $Body -UseSsl:$useSsl -BodyAsHtml:$BodyAsHtml -Attachments $Attachments -ErrorVariable SendMailError
      } else {
        Send-MailMessage -To $emailTo -Subject $Subject -From -$emailFrom -SmtpServer $smtpServer -Body $Body -UseSsl:$useSsl -BodyAsHtml:$BodyAsHtml -ErrorVariable SendMailError
      }
    }
    if($SendMailError) {
      Write-Output $SendMailError
      if($retry -eq $MaxRetryCount) {
        exit 1
      }
    } else {
      exit 0
    }
    Start-Sleep -Seconds 30
    Write-Output 'Retry {0} of {1}...' -f $retry+1, $MaxRetryCount
  }
} catch {
  Write-Output $_.ToString()
  exit 1
}
exit 0
