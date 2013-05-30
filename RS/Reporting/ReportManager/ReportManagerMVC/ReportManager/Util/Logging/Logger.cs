using System;
using System.IO;
using System.Text;

namespace ReportManager.Util.Logging
{
    public enum LogType
    {
        Trace,
        Warning,
        Error,
        Info,
        ClientError
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
                    logPath = AppDomain.CurrentDomain.BaseDirectory + @"bin\Logs\" + DateTime.Now.ToString("yyyy-MM-dd") + @"\";
                return logPath;
            }
            set { logPath = value; }
        }

        private static string logFilePrefix = string.Empty;
        public static string LogFilePrefix
        {
            get { return logFilePrefix; }
            set { logFilePrefix = value; }
        }

        public static void WriteLog(LogType logType, string msg)
        {
            WriteLog(logType.ToString(), msg);
        }

        public static void WriteLog(string Filename, string msg)
        {
            try
            {
                if (!Directory.Exists(LogPath)) Directory.CreateDirectory(LogPath);
                
                StringBuilder sb = new StringBuilder();
                sb.Append(LogPath);
                sb.Append(LogFilePrefix);
                sb.Append(Filename);
                sb.Append("_");
                sb.Append(DateTime.Now.ToString("yyyy-MM-dd"));
                sb.Append(".txt");

                string filePath = sb.ToString();

                if (!File.Exists(filePath)) File.Create(filePath);

                using (FileStream stream = new FileStream(filePath, FileMode.Append))
                {
                    using (StreamWriter writer = new StreamWriter(stream))
                    {
                        writer.WriteLine(msg);
                        writer.WriteLine();
                    }
                }
            }
            catch
            { }
        }
    }
}