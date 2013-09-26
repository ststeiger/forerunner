using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Web;
using System.Text;

namespace ForerunnerWebService
{
    static public class WebSerivceHelper
    {

        static public HttpResponseMessage GetResponseFromBytes(byte[] result, string mimeType, HttpResponseMessage resp, bool cache = false, string fileName = null)
        {

            if (result != null)
            {
                resp.Content = new ByteArrayContent(result); ;
                resp.Content.Headers.ContentType = new MediaTypeHeaderValue(mimeType);
                if (cache)
                    resp.Headers.Add("Cache-Control", "max-age=86400");
                if (fileName != null)
                    resp.Content.Headers.Add("Content-Disposition", "attachment;filename=" + HttpUtility.UrlEncode(fileName));
            }
            else
                resp.StatusCode = HttpStatusCode.NotFound;

            return resp;
        }

        static public HttpResponseMessage ReturnError(Exception e,HttpResponseMessage resp)
        {
            byte[] result = null;
            result = Encoding.UTF8.GetBytes(e.Message);
            return WebSerivceHelper.GetResponseFromBytes(result, "text/JSON", resp);
        }

        static public HttpResponseMessage Redirect(string url, HttpResponseMessage resp)
        {            
            resp.Headers.Location = new Uri(url);
            resp.StatusCode = HttpStatusCode.Found;
            return resp;
        }

    }
}