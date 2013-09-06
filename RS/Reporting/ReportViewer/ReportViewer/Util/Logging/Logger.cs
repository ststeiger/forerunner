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
        }
    }

    public class ExceptionInfoGenerator
    {
        public static void LogExceptionInfo(string errorMsg, Stream RPLStream)
        {
            try
            {
                throw new Exception(errorMsg);
            }
            catch (Exception e)
            {
                GenerateExceptionInfo(e, RPLStream);
            }
        }

        public static void LogExceptionInfo(string errorMsg, Stream RPLStream, Exception subEx)
        {
            try
            {
                throw new Exception(errorMsg, subEx);
            }
            catch (Exception e)
            {
                GenerateExceptionInfo(e, RPLStream);
            }
        }

        private static void GenerateExceptionInfo(Exception e, Stream RPLStream)
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