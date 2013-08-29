using System;
using System.Collections.Generic;
using System.Configuration;
using System.Security.Principal;
using System.Web;
using System.Web.Configuration;
using System.Web.Mvc;
using System.Web.Security;
using ReportManager.Models;

namespace ReportManager.Controllers
{
    [Authorize]
    public class LoginController : Controller
    {
        [AllowAnonymous]
        public ActionResult Login(string returnUrl)
        {
            ViewBag.ReturnUrl = returnUrl;
            return View();
        }

        private HttpCookie FindAuthCookie()
        {
            return Request.Cookies[FormsAuthentication.FormsCookieName];
        }

        [HttpPost]
        [AllowAnonymous]
        [ValidateAntiForgeryToken]
        public ActionResult Login(LoginModel model, string returnUrl)
        {
            if (ModelState.IsValid && 
                Forerunner.Security.AuthenticationMode.GetAuthenticationMode() == AuthenticationMode.Forms)
            {
                HttpCookie authCookie = FindAuthCookie();
                if (authCookie == null || System.Web.HttpContext.Current.Session["Forerunner.Principal"] == null)
                {
                    IntPtr token = IntPtr.Zero;
                    const int LOGON32_LOGON_NETWORK = 3;
                    const int LOGON32_PROVIDER_DEFAULT = 0;

                    try {
                        if (Forerunner.Security.NativeMethods.LogonUser(
                            model.UserName,
                            model.Domain,
                            model.Password,
                            LOGON32_LOGON_NETWORK,
                            LOGON32_PROVIDER_DEFAULT, ref token))
                        {
                            // Write the cookie
                            //FormsAuthentication.SetAuthCookie(model.UserName, false);

                            string userName = (model.Domain != null && model.Domain.Length > 0) ? 
                                model.Domain + "\\" + model.UserName : model.UserName;
                            
                            FormsAuthenticationTicket ticket = new FormsAuthenticationTicket(
                                1,
                                userName,
                                DateTime.Now,
                                DateTime.Now.AddMinutes(30),
                                false,
                                model.Password,
                                FormsAuthentication.FormsCookiePath);

                            // Encrypt the ticket.
                            string encTicket = FormsAuthentication.Encrypt(ticket);// Create the cookie.
                            Response.Cookies.Add(new HttpCookie(FormsAuthentication.FormsCookieName, encTicket));
                            return RedirectToLocal(returnUrl);
                        }
                    } 
                    finally 
                    {
                        if (token != IntPtr.Zero)
                        {
                            Forerunner.Security.NativeMethods.CloseHandle(token);
                        }
                    }
                }
                else
                {
                    if (returnUrl == null)
                    {
                        return RedirectToAction("Index", "Home");
                    }
                    else
                    {
                        return RedirectToLocal(returnUrl);
                    }
                }
            }
            return View(model);
        }

        [HttpPost]
        public ActionResult LogOff()
        {
            FormsAuthentication.SignOut();

            return RedirectToAction("Login", "Login");
        }

        private ActionResult RedirectToLocal(string returnUrl)
        {
            if (Url.IsLocalUrl(returnUrl))
            {
                return Redirect(returnUrl);
            }
            else
            {
                return RedirectToAction("Index", "Home");
            }
        }
    }
}
