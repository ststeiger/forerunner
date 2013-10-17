param(
	[string]$SignToolPath,
	[string]$KeyFilePath,
	[string]$KeyFilePasswordPath,
	[string]$TargetFile
)

[xml]$PasswordXml = [xml](gc $KeyFilePasswordPath)
[string]$Password = $PasswordXml.Credential.Password
& $SignToolPath sign /f $KeyFilePath /p $Password /v $TargetFile
