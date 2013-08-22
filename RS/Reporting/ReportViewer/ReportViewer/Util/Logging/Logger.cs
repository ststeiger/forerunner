using System;
using System.IO;
using System.Text;

namespace ReportManager.Util.Logging
{
    public enum LogType
    {
        Warning,
        Error,
        Info
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

        public static void WriteLineIf(bool isTrace, String category, String message)
        {
            System.Diagnostics.Trace.WriteLineIf(isTrace, category, message);
        }

        public static void Trace(LogType logType, string message, Object[] objects = null) 
        {
            switch (logType)
            {
                case LogType.Error:
                    if (objects == null)
                    {
                        System.Diagnostics.Trace.TraceError(message);
                    }
                    else
                    {
                        System.Diagnostics.Trace.TraceError(message, objects);
                    }
                    break;
                case LogType.Info:
                    if (objects == null)
                    {
                        System.Diagnostics.Trace.TraceInformation(message);
                    }
                    else
                    {
                        System.Diagnostics.Trace.TraceInformation(message, objects);
                    }
                    break;
                case LogType.Warning:
                    if (objects == null)
                    {
                        System.Diagnostics.Trace.TraceWarning(message);
                    }
                    else
                    {
                        System.Diagnostics.Trace.TraceWarning(message, objects);
                    }
                    break;
            }
            System.Diagnostics.Trace.Flush();
        }
    }
}