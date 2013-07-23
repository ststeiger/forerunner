//-----------------------------------------------------------------------
// <copyright file="LiveHttpClientContext.cs" company="Jon Rowlett">
//     Copyright (C) 2013 Jon Rowlett. All rights reserved.
// </copyright>
//-----------------------------------------------------------------------
#define TRACE
namespace Forerunner.Tools.SharepointUploader
{
    using System;
    using System.IO;
    using System.Linq;
    using System.Net;
    using System.Runtime.Serialization;
    using System.Runtime.Serialization.Json;
    using System.Xml;
    using Common;

    /// <summary>
    /// A helper to log in a live user and keep the context for subsequent requests.
    /// </summary>
    internal class LiveHttpClientContext
    {
        /// <summary>
        /// user agent to use.
        /// </summary>
        private const string UserAgent = "Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.2; WOW64; Trident/6.0)";

        /// <summary>
        /// The credentials used to login.
        /// </summary>
        private readonly NetworkCredential credential;

        /// <summary>
        /// cookies that will ultimately store the login token.
        /// </summary>
        private readonly CookieContainer cookies = new CookieContainer();

        /// <summary>
        /// Initializes a new instance of the <see cref="LiveHttpClientContext"/> class.
        /// </summary>
        /// <param name="credential">The credential.</param>
        public LiveHttpClientContext(NetworkCredential credential)
        {
            this.credential = credential;
        }

        /// <summary>
        /// Gets the cookies.
        /// </summary>
        public CookieContainer Cookies
        {
            get
            {
                return this.cookies;
            }
        }

        /// <summary>
        /// Logins the specified site.
        /// </summary>
        /// <param name="site">The site to GET.</param>
        public void Login(Uri site)
        {
            DateTime navStart = DateTime.UtcNow;
            HttpWebRequest initialRequest = this.CreateRequest(site);
            initialRequest.Method = "GET";
            initialRequest.AllowAutoRedirect = true;
            HttpWebResponse initialResponse = (HttpWebResponse)initialRequest.GetResponse();
            if (initialResponse.StatusCode != HttpStatusCode.OK)
            {
                throw CreateProtocolError(initialResponse);
            }

            Common.Web.HtmlDocument loginFormDocument = new Common.Web.HtmlDocument();
            using (StreamReader reader = new StreamReader(initialResponse.GetResponseStream()))
            {
                string htmlText = reader.ReadToEnd();
                Tracing.Source.TraceEvent(System.Diagnostics.TraceEventType.Verbose, 0, htmlText);
                loginFormDocument.LoadHtml(htmlText);
            }

            DateTime realmLoadStart = DateTime.UtcNow;
            RealmData realmData = this.EstablishUserRealm(initialResponse.ResponseUri);
            DateTime realmLoadEnd = DateTime.UtcNow;
            Tracing.Source.TraceEvent(
                System.Diagnostics.TraceEventType.Verbose,
                0,
                "Realm Info: Login=[{0}], NameSpaceType=[{1}], State=[{2}], UserState=[{3}].",
                realmData.Login,
                realmData.NameSpaceType,
                realmData.State,
                realmData.UserState);

            XmlElement form = (XmlElement)loginFormDocument.SelectSingleNode("//form[@id='credentials']");
            if (form == null)
            {
                throw new InvalidOperationException(Properties.Resources.LiveHttpClientContext_LoginFormChangedError);
            }

            string rawLoginUrl = form.Attributes["action"].Value;
            Uri loginUrl = new Uri(rawLoginUrl.Replace("&guests=1", string.Empty));
            string method = form.Attributes["method"].Value;
            HttpWebRequest loginRequest = this.CreateRequest(loginUrl);
            loginRequest.Method = method.ToUpperInvariant();
            loginRequest.AllowAutoRedirect = true;
            using (Common.Web.HtmlFormDataWriter formWriter = new Common.Web.UrlEncodedHtmlFormDataWriter(loginRequest.GetRequestStream()))
            {
                loginRequest.ContentType = formWriter.ContentType;
                foreach (XmlElement inputElement in form.SelectNodes("//input"))
                {
                    string name = inputElement.Attributes["name"].Value;
                    string value = null;
                    if (string.Compare(name, "login", StringComparison.OrdinalIgnoreCase) == 0)
                    {
                        value = this.credential.UserName;
                    }
                    else if (string.Compare(name, "passwd", StringComparison.OrdinalIgnoreCase) == 0)
                    {
                        value = this.credential.Password;
                    }
                    else
                    {
                        value = inputElement.Attributes["value"].Value;
                    }

                    formWriter.WriteInput(name, value);
                }

                // From JS
                // var e = new Date, c = e.getTime() - e.getMilliseconds() - 1.2e5, b = window.performance.timing;
                System.Threading.Thread.Sleep(500);
                DateTime currentTime = DateTime.UtcNow;
                long filteredTime = currentTime.ToUnixTime() - (long)currentTime.Millisecond - 120000;
                formWriter.WriteInput("n1", (navStart.ToUnixTime() - filteredTime).ToString()); // b.navigationStart - c
                formWriter.WriteInput("n2", (-filteredTime).ToString()); // b.redirectStart - c
                formWriter.WriteInput("n3", (-filteredTime).ToString()); // b.redirectEnd - c
                formWriter.WriteInput("n4", (navStart.ToUnixTime() - filteredTime).ToString()); // b.fetchStart - c
                formWriter.WriteInput("n5", (navStart.ToUnixTime() - filteredTime).ToString()); // b.domainLookupStart - c 
                formWriter.WriteInput("n6", (navStart.ToUnixTime() - filteredTime).ToString()); // b.domainLookupEnd - c 
                formWriter.WriteInput("n7", (navStart.ToUnixTime() - filteredTime).ToString()); // b.connectStart - c 
                formWriter.WriteInput("n8", "NaN"); // b.secureConnectionStart - c 
                formWriter.WriteInput("n9", (navStart.ToUnixTime() - filteredTime).ToString()); // b.connectEnd - c 
                formWriter.WriteInput("n10", (navStart.ToUnixTime() - filteredTime).ToString()); // b.requestStart - c 
                formWriter.WriteInput("n11", (navStart.ToUnixTime() - filteredTime).ToString()); // b.responseStart - c 
                formWriter.WriteInput("n12", (navStart.ToUnixTime() - filteredTime).ToString()); // b.responseEnd - c 
                formWriter.WriteInput("n13", (navStart.ToUnixTime() - filteredTime).ToString()); // b.domLoading - c 
                formWriter.WriteInput("n14", (navStart.ToUnixTime() - filteredTime).ToString()); // b.domInteractive - c 
                formWriter.WriteInput("n15", "0"); // b.domContentLoadedEventEnd - b.domContentLoadedEventStart 
                formWriter.WriteInput("n16", (navStart.ToUnixTime() - filteredTime).ToString()); // b.domComplete - c 
                formWriter.WriteInput("n17", (navStart.ToUnixTime() - filteredTime).ToString()); // b.loadEventStart - c 
                formWriter.WriteInput("n18", (navStart.ToUnixTime() - filteredTime).ToString()); // b.loadEventEnd - c 
                formWriter.WriteInput("n19", (realmLoadEnd - realmLoadStart).TotalMilliseconds.ToString()); // Instrument.home_realm_load_time 
                formWriter.WriteInput("n20", "1"); // Instrument.latency_sensitivity 
                formWriter.WriteInput("n21", "0"); // Instrument.prefetch_done ? 1 : 0 
                formWriter.WriteInput("n22", "0"); // Instrument.prefetch_load_time
                formWriter.WriteInput("n23", "0"); // Instrument.background_image_loaded ? 1 : 0 
                formWriter.WriteInput("n24", "0"); // Instrument.background_image_load_time 
                formWriter.WriteInput("n25", "0"); // Tiles.users != null ? Tiles.users.length - 1 : 0 

                formWriter.WriteInput("type", "11");
                formWriter.WriteInput("LoginOptions", "1");
                formWriter.WriteInput("NewUser", "1");
                formWriter.WriteInput("idsbho", "1");
                formWriter.WriteInput("PwdPad", string.Empty);
                formWriter.WriteInput("sso", string.Empty);
                formWriter.WriteInput("vv", string.Empty);
                formWriter.WriteInput("uiver", "1");
                formWriter.WriteInput("i12", string.Compare(loginUrl.Scheme, "https", StringComparison.OrdinalIgnoreCase) == 0 ? "1" : "0");
                formWriter.WriteInput("i13", "MSIE");
                formWriter.WriteInput("i14", "10.0");
                formWriter.WriteInput("i15", "640");
                formWriter.WriteInput("i16", "480");
            }

            HttpWebResponse loginResponse = (HttpWebResponse)loginRequest.GetResponse();
            if (loginResponse.StatusCode != HttpStatusCode.OK || loginResponse.Cookies["RPSTAuth"] == null)
            {
                string message = string.Format(
                    System.Globalization.CultureInfo.CurrentCulture,
                    Properties.Resources.LiveHttpClientContext_AccessDenied,
                    site);
                throw new UnauthorizedAccessException(message);
            }

            Common.Web.HtmlDocument loginResponseDocument = new Common.Web.HtmlDocument();
            using (StreamReader reader = new StreamReader(loginResponse.GetResponseStream()))
            {
                string htmlText = reader.ReadToEnd();
                Tracing.Source.TraceEvent(System.Diagnostics.TraceEventType.Verbose, 0, htmlText);
                loginResponseDocument.LoadHtml(htmlText);
            }

            XmlElement redirectForm = (XmlElement)loginResponseDocument.SelectSingleNode("//form[@id='fmHF']");
            if (redirectForm == null)
            {
                throw CreateProtocolError(loginResponse);
            }
            
            HttpWebRequest redirectRequest = this.CreateRequest(new Uri(redirectForm.GetAttribute("action")));
            redirectRequest.Method = "POST";
            redirectRequest.AllowAutoRedirect = true;
            using (Common.Web.HtmlFormDataWriter formWriter = new Common.Web.UrlEncodedHtmlFormDataWriter(redirectRequest.GetRequestStream()))
            {
                redirectRequest.ContentType = formWriter.ContentType;
                foreach (XmlElement inputElement in redirectForm.SelectNodes("//input"))
                {
                    string name = inputElement.Attributes["name"].Value;
                    string value = inputElement.Attributes["value"].Value;
                    formWriter.WriteInput(name, value);
                }
            }

            HttpWebResponse redirectResponse = (HttpWebResponse)redirectRequest.GetResponse();
            if (redirectResponse.StatusCode != HttpStatusCode.OK ||
                string.Compare(redirectResponse.ResponseUri.Host, site.Host, StringComparison.OrdinalIgnoreCase) != 0)
            {
                throw CreateProtocolError(redirectResponse);
            }
            else
            {
                using (StreamReader reader = new StreamReader(redirectResponse.GetResponseStream()))
                {
                    string htmlText = reader.ReadToEnd();
                    Tracing.Source.TraceEvent(System.Diagnostics.TraceEventType.Verbose, 0, htmlText);
                }
            }
        }

        /// <summary>
        /// Creates the protocol error.
        /// </summary>
        /// <param name="response">The response.</param>
        /// <returns>The exception to throw.</returns>
        private static Exception CreateProtocolError(HttpWebResponse response)
        {
            string message = string.Format(
                System.Globalization.CultureInfo.CurrentCulture,
                Properties.Resources.LiveHttpClientContext_ProtocolError,
                response.StatusCode);
            return new InvalidOperationException(message);
        }

        /// <summary>
        /// Establishes the user realm.
        /// </summary>
        /// <param name="referringUrl">The referring URL.</param>
        /// <returns>realm data info.</returns>
        private RealmData EstablishUserRealm(Uri referringUrl)
        {
            string requestUrl = string.Format(
                System.Globalization.CultureInfo.InvariantCulture,
                "https://login.microsoftonline.com/GetUserRealm.srf?login={0}&handler=1&extended=1",
                Common.Web.HtmlUtility.UrlEncode(this.credential.UserName));
            HttpWebRequest request = this.CreateRequest(new Uri(requestUrl));
            request.Referer = referringUrl.ToString();
            HttpWebResponse response = (HttpWebResponse)request.GetResponse();
            if (response.StatusCode != HttpStatusCode.OK)
            {
                throw CreateProtocolError(response);
            }

            DataContractJsonSerializer serializer = new DataContractJsonSerializer(typeof(RealmData));
            return (RealmData)serializer.ReadObject(response.GetResponseStream());
        }

        /// <summary>
        /// Creates the request.
        /// </summary>
        /// <param name="url">The URL to request.</param>
        /// <returns>A new web request.</returns>
        private HttpWebRequest CreateRequest(Uri url)
        {
            HttpWebRequest request = (HttpWebRequest)HttpWebRequest.Create(url);
            request.UserAgent = UserAgent;
            request.CookieContainer = this.cookies;
            request.Accept = "text/html, application/xhtml+xml, */*";
            request.AutomaticDecompression = DecompressionMethods.Deflate | DecompressionMethods.GZip;
            return request;
        }

        /// <summary>
        /// Deserialized JSON for the realm data.
        /// </summary>
        [DataContract]
        private class RealmData
        {
            /// <summary>
            /// Gets or sets the state.
            /// </summary>
            [DataMember]
            public int State { get; set; }

            /// <summary>
            /// Gets or sets the state of the user.
            /// </summary>
            [DataMember]
            public int UserState { get; set; }

            /// <summary>
            /// Gets or sets the login.
            /// </summary>
            [DataMember]
            public string Login { get; set; }

            /// <summary>
            /// Gets or sets the type of the namespace.
            /// </summary>
            [DataMember]
            public string NameSpaceType { get; set; }
        }
    }
}
