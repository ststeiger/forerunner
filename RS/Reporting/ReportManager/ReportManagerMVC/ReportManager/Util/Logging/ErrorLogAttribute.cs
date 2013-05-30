using System;
using System.Web.Mvc;

namespace ReportManager.Util.Logging
{
    public class ErrorLogAttribute : FilterAttribute, IExceptionFilter
    {
        public void OnException(ExceptionContext filterContext)
        {
            string error = string.Format("[Time:{0}] [Type:{1}] [Controller:{2}] [Action:{3}] [TargetSite:{4}] [Source:{5}] [Message:{6}] [StackTrace:{7}] ",
                DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss: "),
                filterContext.Exception.GetType(),
                filterContext.RouteData.GetRequiredString("controller"),
                filterContext.RouteData.GetRequiredString("action"),
                filterContext.Exception.TargetSite,
                filterContext.Exception.Source,
                filterContext.Exception.Message,
                filterContext.Exception.StackTrace);

            Logger.LogFielPrefix = LogType.Error.ToString();
            Logger.WriteLog(LogType.Error, error);
        }
    }
}