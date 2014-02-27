using System;
using System.Threading;
using System.Web.Http.Filters;

namespace ReportManager.Util.Logging
{
    public class ExceptionLogAttribute : ExceptionFilterAttribute
    {
        public override void OnException(HttpActionExecutedContext actionExecutedContext)
        {
            ThreadPool.QueueUserWorkItem(ExceptionLogGenerator.LogException, actionExecutedContext.Exception);
            base.OnException(actionExecutedContext);
        }
    }

    //public class ActionLogAttribute : ActionFilterAttribute
    //{
    //    public override void OnActionExecuted(HttpActionExecutedContext actionExecutedContext)
    //    {
    //        string info = string.Format("[AbsoluteUri:{0}] \r\n [UserInfo:{1}] \r\n [Controller:{2}] \r\n [Action:{3}]",
    //            actionExecutedContext.Request.RequestUri.AbsoluteUri,
    //            actionExecutedContext.Request.RequestUri.UserInfo,
    //            actionExecutedContext.ActionContext.ControllerContext.ControllerDescriptor.ControllerName,
    //            actionExecutedContext.ActionContext.ActionDescriptor.ActionName);

    //        ThreadPool.QueueUserWorkItem(WriteInfoLog, info);
    //        base.OnActionExecuted(actionExecutedContext);
    //    }

    //    public override void OnActionExecuting(System.Web.Http.Controllers.HttpActionContext actionContext)
    //    {
    //        //Add some thing 
    //        base.OnActionExecuting(actionContext);
    //    }

    //    private void WriteInfoLog(object obj)
    //    {
    //        Logger.Trace(LogType.Info, "ActionLog", new Object[] {obj.ToString()});
    //    }
    //}
}