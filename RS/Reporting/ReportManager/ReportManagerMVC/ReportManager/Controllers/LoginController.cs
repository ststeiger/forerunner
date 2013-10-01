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
                string decodedUrl = HttpUtility.UrlDecode(returnUrl);
                HttpCookie authCookie = FindAuthCookie();
                if (authCookie == null || System.Web.HttpContext.Current.Session["Forerunner.Principal"] == null)
                {
                    IntPtr token = IntPtr.Zero;
                    const int LOGON32_LOGON_NETWORK = 3;
                    const int LOGON32_PROVIDER_DEFAULT = 0;

                    string userName;
                    string domain = "";
                    string[] results = model.UserName.Split('\\');
                    if (results.Length > 1)
                    {
                        domain = results[0];
                        userName = results[1];
                    }
                    else
                    {
                        userName = results[0];
                    }

                    try {
                        if (Forerunner.Security.NativeMethods.LogonUser(
                            userName,
                            domain,
                            model.Password,
                            LOGON32_LOGON_NETWORK,
                            LOGON32_PROVIDER_DEFAULT, ref token))
                        {
                            // Write the cookie
                            //FormsAuthentication.SetAuthCookie(model.UserName, false);
                            
                            FormsAuthenticationTicket ticket = new FormsAuthenticationTicket(
                                1,
                                model.UserName,
                                DateTime.Now,
                                DateTime.Now.AddMinutes(30),
                                false,
                                model.Password,
                                FormsAuthentication.FormsCookiePath);

                            // Encrypt the ticket.
                            string encTicket = FormsAuthentication.Encrypt(ticket);// Create the cookie.
                            Response.Cookies.Add(new HttpCookie(FormsAuthentication.FormsCookieName, encTicket));
                            return CheckNullAndRedirect(returnUrl, decodedUrl);
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
