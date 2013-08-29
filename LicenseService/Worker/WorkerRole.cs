using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Net;
using System.Threading;
using Microsoft.WindowsAzure;
using Microsoft.WindowsAzure.Diagnostics;
using Microsoft.WindowsAzure.ServiceRuntime;
using Microsoft.WindowsAzure.Storage;
using System.Text;
using System.Data.SqlClient;
using System.Net.Mail;
using Register;

namespace Worker
{
    public class WorkerRole : RoleEntryPoint
    {
        private RegisterUtil Reg = new RegisterUtil();

        public override void Run()
        {
            // This is a sample worker implementation. Replace with your logic.
            Trace.TraceInformation("Worker entry point called", "Information");

            while (true)
            {
                Reg.DoWork();
                Thread.Sleep(1000);
            }
        }

        public override bool OnStart()
        {
            // Set the maximum number of concurrent connections 
            ServicePointManager.DefaultConnectionLimit = 12;

            // For information on handling configuration changes
            // see the MSDN topic at http://go.microsoft.com/fwlink/?LinkId=166357.

            return base.OnStart();
        }

        void SendMail(string ID, string email)
        {
            string MailSubject = @"Thank you for registering for your FREE Trial";
            string MailBody =
@"<b>Thank you for registering for your FREE Trial!</b><br><br> 

To dowload your software click <a href='http://127.0.0.1:81/api/Download?id=" + ID + "'>here</a> or copy this link to your brower http://127.0.0.1:81/api/Download?id=" + ID + "<br><br>  Sincerely:<br> The Forerunner Software Team";

            SmtpClient client = new SmtpClient();
            client.Port = 587;
            client.Host = "outlook.office365.com";
            client.EnableSsl = true;
            client.Timeout = 10000;
            client.DeliveryMethod = SmtpDeliveryMethod.Network;
            client.UseDefaultCredentials = false;
            client.Credentials = new System.Net.NetworkCredential("ServiceAccount@forerunnersw.com", "ServicePWD!");

            MailMessage mm = new MailMessage("sales@forerunnersw.com", email, MailSubject, MailBody);
            mm.BodyEncoding = UTF8Encoding.UTF8;
            mm.IsBodyHtml = true;
            mm.DeliveryNotificationOptions = DeliveryNotificationOptions.OnFailure;

            client.Send(mm);


        }
    }
}
