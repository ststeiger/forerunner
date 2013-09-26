using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Data.SqlClient;
using System.Net.Mail;
using System.Xml;
using System.IO;
using System.Text;
using ForerunnerRegister;

namespace ForerunnerWebService
{
    public class TaskWorker
    {
        private static string Domain = ConfigurationManager.AppSettings["Domain"];
        private static string MailSubject = ConfigurationManager.AppSettings["MailSubject"];
        private static string MailBody = ConfigurationManager.AppSettings["MailBody"];
        private static string MailHost = ConfigurationManager.AppSettings["MailHost"];
        private static string MailSendAccount = ConfigurationManager.AppSettings["MailSendAccount"];
        private static string MailSendPassword = ConfigurationManager.AppSettings["MailSendPassword"];
        private static string MailFromAccount = ConfigurationManager.AppSettings["MailFromAccount"];


        private string SendMail(RegistrationData RegData)
        {
            #if DEBUG
                Domain = "localhost";
            #endif

            
            string NewMailBody = String.Format(MailBody, RegData.FirstName, Domain, RegData.ID);

            try
            {
                SmtpClient client = new SmtpClient();
                client.Port = 587;
                client.Host = MailHost;
                client.EnableSsl = true;
                client.Timeout = 50000;
                client.DeliveryMethod = SmtpDeliveryMethod.Network;
                client.UseDefaultCredentials = false;
                client.Credentials = new System.Net.NetworkCredential(MailSendAccount, MailSendPassword);

                MailMessage mm = new MailMessage(MailFromAccount, RegData.Email, MailSubject, NewMailBody);
                mm.BodyEncoding = UTF8Encoding.UTF8;
                mm.IsBodyHtml = true;
                mm.DeliveryNotificationOptions = DeliveryNotificationOptions.OnFailure;

                client.Send(mm);
                return "success";
            }
            catch (Exception e)
            {
                return e.Message;
            }

        }
        
        public void DoWork()
        {
            SqlConnection SQLConn = ForerunnerDB.GetSQLConn();
            SqlDataReader SQLReader;
            Guid TaskID = new Guid();
            string StatusMessage = "";
            int TaskStatus = 0;


            string SQL = @"
BEGIN TRANSACTION
DECLARE @TaskID uniqueidentifier
SELECT TOP 1 @TaskID = TaskID FROM WorkerTasks WHERE TaskStatus = 1 ORDER BY TaskCreated DESC
UPDATE WorkerTasks SET TaskStatus = 2 WHERE TaskID = @TaskID
SELECT TaskID ,TaskType,TaskData  , TaskStatus ,TaskAttempts FROM WorkerTasks WHERE TaskID = @TaskID
COMMIT TRANSACTION          
";
            SQLConn.Open();
            SqlCommand SQLComm = new SqlCommand(SQL, SQLConn);

            SQLReader = SQLComm.ExecuteReader();
            while (SQLReader.Read())
            {
                if (SQLReader.GetString(1) == "SendRegistrationEmail")
                {
                    TaskID = SQLReader.GetGuid(0);
                    RegistrationData RegData = new RegistrationData(SQLReader.GetXmlReader(2));

                    if (RegData.ID != "" && RegData.Email != "")
                        StatusMessage = SendMail(RegData);
                    else
                        break;
                    if (StatusMessage == "success")
                        TaskStatus = 3;
                    else
                        TaskStatus = 1;
                }


            }
            SQLReader.Close();
            SQLConn.Close();

            if (TaskStatus != 0)
            {
                //Save Status
                SQL = @"
    IF ((SELECT TaskAttempts+1 FROM WorkerTasks WHERE TaskID = @TaskID) > 10)
       UPDATE WorkerTasks SET TaskStatus = 4  WHERE TaskID = @TaskID
    ELSE
        UPDATE WorkerTasks SET TaskMessage = @StatusMessage,TaskStatus = @Status,TaskAttempts = TaskAttempts+1  WHERE TaskID = @TaskID
    ";
                SQLConn.Open();
                SQLComm = new SqlCommand(SQL, SQLConn);
                SQLComm.Parameters.AddWithValue("@TaskID", TaskID);
                SQLComm.Parameters.AddWithValue("@StatusMessage", StatusMessage);
                SQLComm.Parameters.AddWithValue("@Status", TaskStatus);
                SQLComm.ExecuteNonQuery();
                SQLConn.Close();
            }

        }

        public void SaveTask(string TaskType, string TaskData)
        {
            SqlConnection SQLConn = ForerunnerDB.GetSQLConn();
            string SQL = @"
INSERT WorkerTasks (TaskID,TaskType,TaskCreated , TaskData  , TaskStatus,TaskAttempts) SELECT NEWID(),@TaskType,GETDATE(),@TaskData,1,0
";
            SqlCommand SQLComm = new SqlCommand(SQL, SQLConn);
            SQLConn.Open();
            SQLComm = new SqlCommand(SQL, SQLConn);
            SQLComm.Parameters.AddWithValue("@TaskType", TaskType);
            SQLComm.Parameters.AddWithValue("@TaskData", TaskData);
            SQLComm.ExecuteNonQuery();
            SQLConn.Close();
        }

       
    }
}