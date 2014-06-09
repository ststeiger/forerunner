param(
	[string]$SignToolPath,
	[string]$KeyFilePath,
	[string]$KeyFilePasswordPath,
	[string]$TargetFile
)

[xml]$PasswordXml = [xml](gc $KeyFilePasswordPath)
[string]$Password = $PasswordXml.Credential.Password
& $SignToolPath sign /f $KeyFilePath /p $Password /t http://timestamp.verisign.com/scripts/timstamp.dll /v $TargetFile
