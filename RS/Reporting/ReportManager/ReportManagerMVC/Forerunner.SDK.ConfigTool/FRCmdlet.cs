using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.IO;
using System.Text.RegularExpressions;
using System.Management.Automation;

using EnvDTE;
using EnvDTE80;

namespace Forerunner.Powershell
{
    public class FRCmdlet : PSCmdlet
    {
        #region Properties

        private string _projectName;
        [Parameter(HelpMessage = "Explicitly defines which project you want configured",
                   ParameterSetName = "config")]
        [Alias("pr")]
        public string ProjectName
        {
            get
            {
                return _projectName;
            }
            set
            {
                _projectName = value;
            }
        }

        private string _webConfigPath;
        [Parameter(HelpMessage = "Fully qualified path, including filename to the web.config file",
                   ParameterSetName = "config")]
        [Alias("w")]
        public string WebConfigPath
        {
            get
            {
                return _webConfigPath;
            }
            set
            {
                _webConfigPath = value;
            }
        }

        private System.Configuration.Configuration _appConfig = null;
        protected System.Configuration.Configuration AppConfig
        {
            get
            {
                if (_appConfig != null)
                {
                    return _appConfig;
                }

                string webConfigPath = WebConfigPath;
                if (webConfigPath == null)
                {
                    webConfigPath = GetLocalFilePathFromProject(@"\", "web.config");
                    if (webConfigPath == null)
                    {
                        throw (new Exception("Error - Unable to find file: web.config, try setting -WebConfigPath"));
                    }
                }
                System.Configuration.ExeConfigurationFileMap configFileMap = new System.Configuration.ExeConfigurationFileMap();
                configFileMap.ExeConfigFilename = webConfigPath;
                _appConfig = System.Configuration.ConfigurationManager.OpenMappedExeConfiguration(configFileMap, System.Configuration.ConfigurationUserLevel.None);
                return _appConfig;
            }
        }

        private DTE2 _dte2 = null;
        protected DTE2 DTE2
        {
            get
            {
                if (_dte2 == null)
                {
                    _dte2 = (DTE2)GetVariableValue("DTE");
                }
                return _dte2;
            }
        }
        
        protected Project DefaultProject
        {
            get
            {
                string prjKindCSharpProject = "{FAE04EC0-301F-11D3-BF4B-00C04F79EFBC}";
                var dte = (DTE2)GetVariableValue("DTE");
                if (dte == null)
                {
                    return null;
                }
                Project project = null;
                var solution = (Solution)dte.Solution;
                var solutionProjects = (Projects)solution.Projects;

                // If we don't have the project name, try to heuristically get the project
                foreach (Project p in solutionProjects)
                {
                    if (ProjectName != null)
                    {
                        if (String.Compare(ProjectName, p.Name, true) == 0)
                        {
                            project = p;
                            break;
                        }
                    }
                    else if (prjKindCSharpProject == p.Kind)
                    {
                        if (project != null)
                        {
                            throw new Exception("Unable to determine which project you want configured. Use the -ProjectName switch");
                        }
                        project = p;
                    }
                }

                return project;
            }
        }
        
        private string _assemblyPath = null;
        protected string AssemblyPath
        {
            get
            {
                if (_assemblyPath != null)
                {
                    return _assemblyPath;
                }

                string codeBase = System.Reflection.Assembly.GetExecutingAssembly().CodeBase;
                UriBuilder uri = new UriBuilder(codeBase);
                _assemblyPath = Path.GetDirectoryName(Uri.UnescapeDataString(uri.Path));
                return _assemblyPath;
            }
        }
        
        private string _defaultNamespace = null;
        protected string DefaultNamespace
        {
            get
            {
                if (_defaultNamespace != null)
                {
                    return _defaultNamespace;
                }
                Properties properties = DefaultProject.Properties;
                _defaultNamespace = properties.Item("DefaultNamespace").Value;
                return _defaultNamespace;
            }
        }

        #endregion  // Parameter properties / definitions

        #region Methods

        protected string GetFullPath(string projectFullName, string projectRelativePath, string filename)
        {
            int index = projectFullName.LastIndexOf(@"\");
            string path = projectRelativePath.Substring(0, 1) == @"\" ? projectRelativePath : @"\" + projectRelativePath;
            return Path.Combine(projectFullName.Substring(0, index) + path, filename);
        }
        protected ProjectItem GetProjectItem(ProjectItems items, string fullPath)
        {
            foreach (ProjectItem item in items)
            {
                string itemFullPath = item.Properties.Item("FullPath").Value;
                if (String.Compare(itemFullPath, fullPath, true) == 0)
                {
                    return item;
                }

                ProjectItems items2 = item.ProjectItems;
                if (items2 != null && items2.Count > 0)
                {
                    ProjectItem item2 = GetProjectItem(items2, fullPath);
                    if (item2 != null)
                    {
                        return item2;
                    }
                }
            }
            return null;
        }
        protected string GetLocalFilePathFromProject(string projectRelativePath, string filename)
        {
            if (DefaultProject == null)
            {
                if (ProjectName != null)
                {
                    throw new Exception("The given -ProjectName: " + ProjectName + " doesn't exist in the solution");
                }
                throw new Exception("Unable to determine which project you want configured. Use the -ProjectName switch");
            }

            var projectItems = (ProjectItems)DefaultProject.ProjectItems;
            string fullPath = GetFullPath(DefaultProject.FullName, projectRelativePath, filename);
            ProjectItem projectItem = GetProjectItem(projectItems, fullPath);
            if (projectItem == null)
            {
                return null;
            }
            var properties = (Properties)projectItem.Properties;
            var property = (Property)properties.Item("LocalPath");
            return property.Value;
        }
        protected string GetProjectDirectory()
        {
            Project project = DefaultProject;
            return Path.GetDirectoryName(project.FullName);
        }
        protected void CreateMissingFile(string destPath, string placeholderNamespace = "GettingStartedV4")
        {
            string fullPath = Path.Combine(GetProjectDirectory(), destPath);

            if (File.Exists(fullPath))
            {
                // If the file exists we are done
                return;
            }

            // Make sure the folder structure exists
            string projPath = GetProjectDirectory();
            string relativePath = Path.GetDirectoryName(fullPath).Substring(projPath.Length);
            if (relativePath != null && relativePath.Length > 0)
            {
                char[] sep = { '\\' };
                string[] folders = relativePath.Split(sep);
                string curFolder = projPath;
                foreach (string folder in folders)
                {
                    if (folder.Length > 0)
                    {
                        curFolder = Path.Combine(curFolder, folder);
                        Directory.CreateDirectory(curFolder);
                    }
                }
            }

            // Create the file and rename the namespace reference
            string sourcePath = Path.Combine(AssemblyPath, Path.GetFileName(destPath));

            if (File.Exists(sourcePath))
            {
                string source = File.ReadAllText(sourcePath);

                if (placeholderNamespace != null && placeholderNamespace.Length > 0)
                {
                    source = source.Replace(placeholderNamespace, DefaultNamespace);
                }
                File.WriteAllText(fullPath, source);
            }
            else
            {
                File.Create(fullPath);
            }

            // Now create the project folders and item
            char[] seps = { '\\' };
            string[] parts = destPath.Split(seps);
            Project project = DefaultProject;
            AddExistingItem(fullPath, project.ProjectItems, parts);
        }
        protected ProjectItem AddExistingItem(string fullPath, ProjectItems items, string[] parts)
        {
            string[] newParts = null;

            ProjectItem item = null;
            try
            {
                item = items.Item(parts[0]);
            }
            catch { }

            if (item == null)
            {
                if (parts.Length == 1)
                {
                    return items.AddFromFile(Path.Combine(GetProjectDirectory(), fullPath));
                }

                ProjectItem newItem = items.AddFolder(parts[0]);
                newParts = new string[parts.Length - 1];
                Array.Copy(parts, 1, newParts, 0, parts.Length - 1);
                return AddExistingItem(fullPath, newItem.ProjectItems, newParts);
            }
            else if (parts.Length == 1)
            {
                return item;
            }

            newParts = new string[parts.Length - 1];
            Array.Copy(parts, 1, newParts, 0, parts.Length - 1);
            return AddExistingItem(fullPath, item.ProjectItems, newParts);
        }

        protected bool AutomaticEditInsert(string path, string pattern, string markComment, string insertText, string searchText = null)
        {
            if (path == null || !File.Exists(path))
            {
                WriteWarning("Warning - File: " + path + ", not found");
                return false;
            }

            // Read the file into a string
            string fileText = File.ReadAllText(path);

            // See if we have already made the automatic edit to this file
            if (fileText.IndexOf(markComment) != -1 ||
                (searchText != null) && fileText.IndexOf(searchText) != -1)
            {
                // The mark text is already in the file so we are done
                return true;
            }

            // Do the automatic insert
            Regex regex = new Regex(pattern);
            Match match = regex.Match(fileText);

            if (!match.Success)
            {
                throw (new Exception("Search pattern: " + pattern + " not found in file: " + path));
            }

            var sb = new StringBuilder();
            sb.Append(fileText.Substring(0, match.Index + match.Length));
            sb.Append("\r\n" +
                      "            // Set-FRConfig, Automatic edit start: " + markComment + "\r\n" +
                      "            // Keep the comment above and Set-FRConfig will not change this edit again\r\n");
            sb.Append(insertText);
            sb.Append("            // Set-FRConfig, Automatic edit end: " + markComment + "\r\n");
            sb.Append(fileText.Substring(match.Index + match.Length));

            // Save the file back
            WriteVerbose("Saving file: " + path);
            File.WriteAllText(path, sb.ToString());
            return true;
        }

        protected void AddPrompt(string name, string currentValue, string helpMessage, ref System.Collections.ObjectModel.Collection<System.Management.Automation.Host.FieldDescription> descriptions, out string prompt)
        {
            const string returnEqualsFormat = "{0} (return = '{1}')";
            prompt = name;
            if (currentValue != null && currentValue.Length > 0)
            {
                prompt = String.Format(returnEqualsFormat, prompt, currentValue);
            }
            var description = new System.Management.Automation.Host.FieldDescription(prompt);
            description.HelpMessage = helpMessage;
            descriptions.Add(description);
        }
        protected void AssignResult(ref string prop, string resultsKey, Dictionary<string, PSObject> results)
        {
            PSObject value = null;
            bool hasValue = results.TryGetValue(resultsKey, out value);
            if (!hasValue)
            {
                // Nothing to assign here this key was not prompted for
                return;
            }

            string result = (string)value.BaseObject;
            if (result == null || result.Length == 0)
            {
                // If the user just hit return the we keep whatever value we have
                return;
            }

            prop = result;
        }

        protected string GetAppSetting(string name, string prefix = frAppSettingPrefix)
        {
            string key = prefix + name;
            if (AppConfig.AppSettings.Settings[key] != null)
            {
                return AppConfig.AppSettings.Settings[key].Value;
            }

            return null;
        }
        protected void SetAppSetting(string name, string value, string prefix = frAppSettingPrefix)
        {
            string fullName = prefix + name;
            AppConfig.AppSettings.Settings.Remove(fullName);
            AppConfig.AppSettings.Settings.Add(fullName, value);
        }
        protected void AssignAppSetting(ref string prop, string name, string defaultValue = null, string prefix = frAppSettingPrefix)
        {
            if (prop != null && prop.Length > 0)
            {
                // Always take parameters that are specified on the command line
                return;
            }

            var value = GetAppSetting(name, prefix);
            if (value != null && value.Length > 0)
            {
                // Take the value from the given web.config file (app settings)
                prop = value;
                return;
            }

            // Otherwise assign the default value (or null)
            prop = defaultValue;
        }
        private const string frAppSettingPrefix = "Forerunner.";

        #endregion  // protected methods
    }
}
