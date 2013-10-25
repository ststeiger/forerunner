@echo off
set MailBody=%1
set SubjectUnfiltered=%2
set Subject=%SubjectUnfiltered:"=%
set ProjectName=%3
set BuildVersion=%4
set DropLocationUnfiltered=%5
set DropLocation=%DropLocationUnfiltered:"=%
echo ^<html^> > %MailBody%
echo   ^<head^> >> %MailBody%
echo     ^<title^>%Subject%^</title^> >> %MailBody%
echo     ^<style type="text/css"^> >> %MailBody%
type %~dp0mail.css >> %MailBody%
echo     ^</style^> >> %MailBody%
echo   ^</head^> >> %MailBody%
echo   ^<body^> >> %MailBody%
echo     ^<p^>The build ^<b class="Succeeded"^>succeeded.^</b^>^</p^> >> %MailBody%
echo	 ^<table^> >> %MailBody%
echo	   ^<tbody^> >> %MailBody%
echo	     ^<tr^> >> %MailBody%

echo           ^<th^>Drop location:^</th^>^<td^>^<a href="%DropLocation%"^>%DropLocation%^</a^>^</td^> >> %MailBody%
echo	     ^</tr^> >> %MailBody%
echo         ^<tr^>^<th^>Project:^</th^>^<td^>%ProjectName%^</td^>^</tr^> >> %MailBody%
echo         ^<tr^>^<th^>Version:^</th^>^<td^>%BuildVersion%^</td^>^</tr^> >> %MailBody%
echo	     ^<tr^> >> %MailBody%

echo           ^<th^>Download Setup:^</th^>^<td^>^<a href="%DropLocation%/ForerunnerMobilizer.zip"^>%DropLocation%/ForerunnerMobilizer.zip^</a^>^</td^> >> %MailBody%
echo	     ^</tr^> >> %MailBody%
echo       ^</tbody^> >> %MailBody%
echo	 ^</table^> >> %MailBody%
echo     ^<p^>See ^<a href="%DropLocation%/build.log"^>build.log^</a^> for more details.^</p^> >> %MailBody%
echo   ^</body^> >> %MailBody%
echo ^</html^> >> %MailBody% 

