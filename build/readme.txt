Forerunner Build System
-----------------------
The build system is a simple wrapper around msbuild to produce automated daily builds with unique build numbers, publish files, and send build reports.

The build structure is based on best practices (http://msdn.microsoft.com/en-us/magazine/dd483291.aspx) where dirs.proj are used to include all the projects that need to be built. The "build" directory off the root has build support files and tools that are specific to the daily build automation.

Setting up a New Build Machine
------------------------------
1. Install Windows Server 2012 Standard. Windows Server 2008 R2 will also work, but the .Net 4.5 redist needs to be installed.
2. Install GIT for Windows (http://code.google.com/p/msysgit/downloads/list?can=3&q=official+Git)
	a. Make sure git gets added to the path (default).
3. Create a build account (buildbot) which has logon as batch rights. This could be a local or domain account. For initial setup, it is useful to allow the user logon locally rights on the build machine. In practice, buildbot is a local admin on the build machine.
4. Create an enlistment directory. ex. (C:\Code\Forerunner).
	a. Make sure the build account is the owner and has full control over all files and directories.
5. Create an SSH key for the build account.
	a. Logon as the build account (if not already).
	b. Follow these directions. (https://help.github.com/articles/generating-ssh-keys) except for the part
about the passphrase. Keep that blank - otherwise all git operations will prompt and prevent automation from working.
6. cd to the enlistment and run "git pull git@github.com:forerunnersw/Forerunner.git"
7. Install .Net 3.5 and 2.0. (http://msdn.microsoft.com/en-us/library/hh506443.aspx)
8. Install VS 2012.
9. Install NSIS from (http://sourceforge.net/projects/nsis/). The current version to install is 2.46.
	a. Create a <machine>.cmd under build. Use MASON.cmd as a template.
	b. Make sure NSIS_TOOL references NSIS.exe in the right path.
10. Test the build: "build\build.cmd"
11. Setup E-Mail.
	a. In Powershell, execute "Set-ExecutionPolicy Unrestricted"
    b. Create smtp.config.xml under build.
	The format of this file is:
		<?xml version="1.0"?>
		<SmtpConfiguration 
        	Server="smtp.gmail.com" 
	        To="motherplucker@gmail.com" 
    	    From="motherplucker@gmail.com" 
        	UseSsl="1" 
	        UserName="motherplucker" 
    	    Password="***********" 
        	/>
12. Setup Daily Task Scheduler Job.
	a. Import "Daily Build.xml" to Task Scheduler.
	b. Run the job manually to make sure it is working.
13. Setup Drop to Sharepoint.
	a. Create a Credentials.xml in the build dir for connecting to SP:
<?xml version="1.0" encoding="utf-8" ?>
<Credential UserName="stellar@forerunnersw.com" Password="*******"/>
	b. Make sure this is in .gitignore so it does not get checked in.

Adding a new Project
--------------------
Currently, there are no project file requirements or special macros or targets that have to get added to each project. Projects, however, do need to be referenced in their parent directory's dirs.proj to get included in the build. 
