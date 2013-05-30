using System;
using System.IO;

namespace ReportManager.Util.Logging
{
    public enum LogType
    {
        Trace,
        Warning,
        Error
    }

    public class Logger
    {
        //private static string logPath = ConfigurationManager.AppSettings["ForeRunner.LogPath"];
        private static string logPath = string.Empty;

        public static string LogPath
        {
            get
            {
                if (logPath == string.Empty)
                    logPath = AppDomain.CurrentDomain.BaseDirectory + @"bin\";
                return logPath;
            }
            set { logPath = value; }
        }

        private static string logFielPrefix = string.Empty;
        public static string LogFielPrefix
        {
            get { return logFielPrefix; }
            set { logFielPrefix = value; }
        }

        public static void WriteLog(string Filename, string msg)
        {
            try
            {
                string path = LogPath + LogFielPrefix + Filename + "_" + DateTime.Now.ToString("yyyy-MM-dd") + ".txt";
                using (FileStream stream = new FileStream(path, FileMode.OpenOrCreate))
                {
                    using (StreamWriter writer = new StreamWriter(stream))
                    {
                        writer.Write(msg);
                    }
                }
            }
            catch
            { }
        }

        public static void WriteLog(LogType logType, string msg)
        {
            WriteLog(logType.ToString(), msg);
        }
    }
}