using System;
using System.Diagnostics;
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
        //private static string logPath = string.Empty;

        //public static string LogPath
        //{
        //    get
        //    {
        //        if (logPath == string.Empty)
        //            logPath = AppDomain.CurrentDomain.BaseDirectory + @"bin\Logs\" + DateTime.Now.ToString("yyyy-MM-dd") + @"\";
        //        return logPath;
        //    }
        //    set { logPath = value; }
        //}

        //private static string logFilePrefix = string.Empty;
        //public static string LogFilePrefix
        //{
        //    get { return logFilePrefix; }
        //    set { logFilePrefix = value; }
        //}

        static private TraceSource ts = new TraceSource("ForerunnerMobilizer", SourceLevels.All);
        static private bool isInit = false;

        static Logger()
        {
            lock (ts)
            {
                if (!isInit)
                {
                    if (System.Web.HttpContext.Current != null)
                    {
                        string path = System.Web.HttpContext.Current.Server.MapPath("~");
                        DateTime now = DateTime.Now;
                        string fileName = String.Format("Forerunner_{0}_{1}_{2}_{3}_{4}_{5}.log", now.Month, now.Day, now.Year, now.Hour, now.Minute, now.Second);
                        string filePath = path + @"\..\LogFiles\" + fileName;
                        TraceListener listener = new TextWriterTraceListener(filePath);
                        ts.Listeners.Add(listener);
                        Trace(LogType.Info, "Logging to " + fileName + "...");
                    }
                    ts.Listeners.Add(new ConsoleTraceListener());
                    isInit = true;
                }
            }
        }

        public static void Trace(LogType logType, string message, Object[] objects = null) 
        {
            TraceEventType eventType = TraceEventType.Information;
            switch (logType)
            {
                case LogType.Error:
                    eventType = TraceEventType.Error;
                    break;
                case LogType.Info:
                    eventType = TraceEventType.Information;
                    break;
                case LogType.Warning:
                    eventType = TraceEventType.Warning;
                    break;
            }
            if (objects == null)
            {
                ts.TraceEvent(eventType, 0, message);
            }
            else
            {
                ts.TraceEvent(eventType, 0, message, objects);
            }
            ts.Flush();
        }
    }

    public class ExceptionLogGenerator
    {
        public static void LogException(object obj)
        {
            Exception e = (Exception)obj;
            LogException(e);
        }

        public static void LogException(Exception e)
        {
            string error = string.Format("[Time:{0}] \r\n [Type:{1}] \r\n [TargetSite:{2}] \r\n [Source:{3}] \r\n [Message:{4}] \r\n [StackTrace:{5}] ",
                   DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss "), e.GetType(), e.TargetSite, e.Source, e.Message, e.StackTrace);

            Logger.Trace(LogType.Error, "Exception:\r\n{0}", new object[] { error });
        }

        public static void LogExceptionWithRPL(string errorMsg, Stream RPLStream)
        {
            try
            {
                throw new Exception(errorMsg);
            }
            catch (Exception e)
            {
                GenerateExceptionWithRPL(e, RPLStream);
            }
        }

        public static void LogExceptionWithRPL(string errorMsg, Stream RPLStream, Exception subEx)
        {
            try
            {
                throw new Exception(errorMsg, subEx);
            }
            catch (Exception e)
            {
                GenerateExceptionWithRPL(e, RPLStream);
            }
        }

        private static void GenerateExceptionWithRPL(Exception e, Stream RPLStream)
        {
            StackTrace trace = new StackTrace(true);
            StringBuilder stackTraceInfo = new StringBuilder();
            for (int i = 0; i < trace.FrameCount; i++)
            {
                StackFrame sf = trace.GetFrame(i);
                stackTraceInfo.Append(string.Format("Method:{0}", sf.GetMethod()));
                stackTraceInfo.AppendLine();
                stackTraceInfo.Append(string.Format("File:{0}", sf.GetFileName()));
                stackTraceInfo.AppendLine();
                stackTraceInfo.Append(string.Format("Line Number:{0}", sf.GetFileLineNumber()));
                stackTraceInfo.AppendLine();
            }

            StringBuilder rplOutput = new StringBuilder();
            int len = 0;
            byte[] rplBuffer = new byte[1024 * 3];

            //Reset the RPL Stream Position
            RPLStream.Position = 0;
            while ((len = RPLStream.Read(rplBuffer, 0, rplBuffer.Length)) > 0)
            {
                rplOutput.Append(Convert.ToBase64String(rplBuffer, 0, len, Base64FormattingOptions.None));
            }

            string error = string.Format("[Time: {0}]\r\n[Type: {1}]\r\n[Message: {2}]\r\n[StackTrace:\r\n{3}]\r\n[RPL: {4}]",
                DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss "), e.GetType(), e.Message, stackTraceInfo.ToString(), rplOutput.ToString());

            Logger.Trace(LogType.Error, "Exception:\r\n{0}", new object[] { error });
            
            throw e;
        }
    }
}