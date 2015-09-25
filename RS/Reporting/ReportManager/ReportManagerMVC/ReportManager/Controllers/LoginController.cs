﻿using System;
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
        public ActionResult Login(string returnUrl, string hashTag)
        {
            ViewBag.ReturnUrl = returnUrl;
            ViewBag.HashTag = hashTag;
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
        public ActionResult Login(LoginModel model, string returnUrl, string hashTag)
        {
            if (ModelState.IsValid && 
                Forerunner.Security.AuthenticationMode.GetAuthenticationMode() == System.Web.Configuration.AuthenticationMode.Forms)
            {
                string decodedUrl = HttpUtility.UrlDecode(returnUrl);
                if (hashTag != null)
                    decodedUrl += ("#" + hashTag.Replace("%2f%2f", "/%2f"));
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

        [HttpGet]
        public ActionResult LogOff(string returnUrl)
        {
            FormsAuthentication.SignOut();

            if (returnUrl == null)
            {
                return RedirectToAction("Index", "Home");
            }
            else
            {
                return Redirect(HttpUtility.UrlDecode(returnUrl));
            }
        }
    }
}
