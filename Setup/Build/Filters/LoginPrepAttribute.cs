using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using System.Web.Security;

namespace ReportManager
{
    public class LoginPrepAttribute : AuthorizeAttribute
    {
        protected override void HandleUnauthorizedRequest(AuthorizationContext filterContext)
        {
            bool isFormsAuth = Forerunner.Security.AuthenticationMode.GetAuthenticationMode() == System.Web.Configuration.AuthenticationMode.Forms;
            bool hasHashTag = filterContext.HttpContext.Request["HashTag"] != null;
            if (isFormsAuth && !hasHashTag)
            {
                ViewResult result = new ViewResult { ViewName = "../Login/LoginPrep" };
                result.ViewBag.LoginUrl = Forerunner.Security.AuthenticationMode.GetLoginUrl();
                filterContext.Result = result;
            }
        }
    }
}