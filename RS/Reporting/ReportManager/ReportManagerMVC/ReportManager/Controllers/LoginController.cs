using System;
using System.Collections.Generic;
using System.Configuration;
using System.Web;
using System.Web.Mvc;
using System.Web.Security;
using ReportManager.Models;
using Forerunner.Security;

namespace ReportManager.Controllers
{
    [Authorize]
    public class LoginController : Controller
    {
        private string timeout = ConfigurationManager.AppSettings["Forerunner.FormsAuthenticationTimeout"];

        [AllowAnonymous]
        public ActionResult Login(string returnUrl)
        {
            ViewBag.ReturnUrl = returnUrl;
            return View();
        }



        private const int defaultTimeout = 30;
        private int GetTimeout()
        {
            int returnValue = defaultTimeout;
            if (timeout != null)
            {
                
                try
                {
                    returnValue = Int32.Parse(timeout);
                }
                catch
                {
                    returnValue = defaultTimeout;
                }
            }

            return returnValue;
        }

        [HttpPost]
        [AllowAnonymous]
        [ValidateAntiForgeryToken]
        public ActionResult Login(LoginModel model, string returnUrl)
        {
            if (ModelState.IsValid && 
                Forerunner.Security.AuthenticationMode.GetAuthenticationMode() == System.Web.Configuration.AuthenticationMode.Forms)
            {
                string decodedUrl = HttpUtility.UrlDecode(returnUrl);
                if (FormsAuthenticationHelper.Login(model.UserName, model.Password, GetTimeout()))
                {
                    return CheckNullAndRedirect(returnUrl, decodedUrl);
                } else {
                    return CheckNullAndRedirect(returnUrl, decodedUrl);
                }
            }
            return View(model);
        }

        private ActionResult CheckNullAndRedirect(string returnUrl, string decodedUrl)
        {
            if (returnUrl == null)
            {
                return RedirectToAction("Index", "Home");
            }
            else
            {
                return Redirect(decodedUrl);
            }
        }

        [HttpPost]
        public ActionResult LogOff()
        {
            FormsAuthentication.SignOut();

            return RedirectToAction("Login", "Login");
        }
    }
}
