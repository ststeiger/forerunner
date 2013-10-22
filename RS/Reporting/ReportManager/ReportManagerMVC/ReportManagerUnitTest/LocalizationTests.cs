using System;
using System.IO;
using System.Collections.Generic;
using System.Web.Helpers;
using System.Dynamic;
using System.Text;
using Microsoft.VisualStudio.TestTools.UnitTesting;

namespace ReportManagerUnitTest
{
    public enum ProcessResult
    {
        UpToDate = 0,
        Changed = 1,
        NeedsTranslation = 2,
    }

    public class Section : Dictionary<String, String>
    {
        public ProcessResult Process(Section section, String sectionName, bool skipTranslationCheck)
        {
            ProcessResult result = ProcessResult.UpToDate;

            foreach (KeyValuePair<String, String> pair in this)
            {
                if (!section.ContainsKey(pair.Key))
                {
                    Console.WriteLine("  Missing value - section: {0}, property: {1}", sectionName, pair.Key);
                    section.Add(pair.Key, pair.Value);
                    result |= ProcessResult.Changed;
                }

                if (!skipTranslationCheck &&
                    String.Compare(section[pair.Key], this[pair.Key], true) == 0)
                {
                    Console.WriteLine("  Value needs translation - section: {0}, property: {1}", sectionName, pair.Key);
                    result |= ProcessResult.NeedsTranslation;
                }
            }

            return result;
        }
    }

    public class LocFile : Dictionary<String, Section>
    {
        public LocFile()
        {
        }

        public void Load(String fullname)
        {
            String json;
            using (StreamReader sr = new StreamReader(fullname))
            {
                json = sr.ReadToEnd();
            }

            dynamic sections = Json.Decode(json);

            foreach (var sectionPair in sections)
            {
                String key = sectionPair.Key;
                dynamic sectionObject = sectionPair.Value;

                Section newSection = new Section();
                foreach (dynamic valuePair in sectionObject)
                {
                    newSection.Add(valuePair.Key, valuePair.Value);
                }
                Add(key, newSection);
            }
        }

        public ProcessResult Process(LocFile locFile, bool skipTranslationCheck)
        {
            ProcessResult result = ProcessResult.UpToDate;

            foreach (KeyValuePair<String, Section> pair in this)
            {
                if (!locFile.ContainsKey(pair.Key))
                {
                    Console.WriteLine("  Missing section: {0}", pair.Key);
                    locFile.Add(pair.Key, pair.Value);
                    result |= ProcessResult.Changed;
                }

                ProcessResult processResult = pair.Value.Process(locFile[pair.Key], pair.Key, skipTranslationCheck);
                result |= processResult;
            }

            return result;
        }
    }

    [TestClass]
    public class LocalizationTests
    {
        public TestContext TestContext { get; set; }

        private bool isEnglish(String filename)
        {
            if (filename.EndsWith("en.txt", true, System.Globalization.CultureInfo.CurrentCulture) ||
                (String.Compare(filename.Substring(filename.Length - 10, 3), "-en", true) == 0))
            {
                return true;
            }

            return false;
        }

        [TestMethod]
        public void MissingTranslationTest()
        {
            // Get the localization file directory relative to the current working directory
            String locDirectory = Path.GetFullPath(Environment.CurrentDirectory + @"\..\..\..\ReportManager\Forerunner\ReportViewer\Loc");
            Assert.IsTrue(Directory.Exists(locDirectory), "locDirectory is not valid");

            // Load the master (I.e., engish) file
            String masterFilePath = Path.Combine(locDirectory, @"ReportViewer-en.txt");
            Assert.IsTrue(File.Exists(masterFilePath), "masterFile: " + Path.GetFileName(masterFilePath) + " not found");

            LocFile masterLocFile = new LocFile();
            masterLocFile.Load(masterFilePath);

            // Loop through the other locals and verify against the master
            DirectoryInfo dirInfo = new DirectoryInfo(locDirectory);
            foreach (FileInfo fileInfo in dirInfo.EnumerateFiles("*.txt"))
            {
                if (fileInfo.Name.CompareTo(Path.GetFileName(masterFilePath)) == 0)
                {
                    continue;
                }

                Console.WriteLine("Processing file: {0}", fileInfo.Name);

                LocFile locFile = new LocFile();
                locFile.Load(fileInfo.FullName);
                ProcessResult result = masterLocFile.Process(locFile, isEnglish(fileInfo.Name));
                if ((result & ProcessResult.Changed) == 0)
                {
                    Console.WriteLine("  File up to date, no changes");
                }
                else
                {
                    // Encode the locFile into a JSON string
                    var jsonString = Json.Encode(locFile);

                    // Format for editing
                    if (jsonString.StartsWith("{"))
                    {
                        jsonString = "{\n  " + jsonString.Substring(1);
                    }
                    jsonString = jsonString.Replace("\":{\"", "\": {\n    \"");
                    jsonString = jsonString.Replace("\",\"", "\",\n    \"");
                    jsonString = jsonString.Replace("\"},\"", "\"\n  },\n  \"");
                    jsonString = jsonString.Replace("}}", "\n  }\n}\n");

                    // Write the file out
                    using (StreamWriter sw = new StreamWriter(fileInfo.FullName, false, Encoding.UTF8))
                    {
                        sw.Write(jsonString);
                    }
                }
            }
        }
    }
}
