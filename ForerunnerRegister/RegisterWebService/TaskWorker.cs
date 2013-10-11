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
using ForerunnerWebService;

namespace ForerunnerWebService
{
    public class TaskWorker
    {

        
        private static string MailHost = ConfigurationManager.AppSettings["MailHost"];
        private static string MailSendAccount = ConfigurationManager.AppSettings["MailSendAccount"];
        private static string MailSendPassword = ConfigurationManager.AppSettings["MailSendPassword"];
        
        public void DoWork()
        {
            ForerunnerDB DB = new ForerunnerDB();
            SqlConnection SQLConn = DB.GetSQLConn();
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

            try
            {
                SQLConn.Open();
                SqlCommand SQLComm = new SqlCommand(SQL, SQLConn);

                string TaskType;
                SQLReader = SQLComm.ExecuteReader();
                while (SQLReader.Read())
                {
                    TaskType = SQLReader.GetString(1);
                    TaskID = SQLReader.GetGuid(0);
                    if (TaskType == "SendRegistrationEmail")
                    {
                        Register Reg = new Register();
                        StatusMessage = Reg.SendRegisterMail(SQLReader.GetXmlReader(2), this);
                    }
                    if (TaskType == "NewShopifyOrder")
                    {
                        Order Or = new Order();
                        StatusMessage = Or.ProcessShopifyOrder(SQLReader.GetXmlReader(2));
                    }

                    if (TaskType == "SendLicenseEmail")
                    {
                        Order Or = new Order();
                        StatusMessage = Or.SendLicenseMail(SQLReader.GetXmlReader(2), this);
                    }

                    if (StatusMessage == "success")
                        TaskStatus = 3;
                    else
                        TaskStatus = 1;

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
            catch
            {
                SQLConn.Close();
            }

        }

        public void SaveTask(string TaskType, string TaskData,string Requester = "No Requester")
        {
            ForerunnerDB DB = new ForerunnerDB();
            SqlConnection SQLConn = DB.GetSQLConn();
            
            string SQL = @"
INSERT WorkerTasks (TaskID,TaskType,TaskCreated , TaskData  , TaskStatus,TaskAttempts,Requester) SELECT NEWID(),@TaskType,GETDATE(),@TaskData,1,0,@Requester
";
            SqlCommand SQLComm = new SqlCommand(SQL, SQLConn);
            SQLConn.Open();
            try
            {
                SQLComm = new SqlCommand(SQL, SQLConn);
                SQLComm.Parameters.AddWithValue("@TaskType", TaskType);
                SQLComm.Parameters.AddWithValue("@TaskData", TaskData);
                SQLComm.Parameters.AddWithValue("@Requester", Requester);
                SQLComm.ExecuteNonQuery();
            }
            catch (Exception e)
            {
                SQLConn.Close();
                throw (e);
            }
            SQLConn.Close();
        }

        public string SendMail(string MailFromAccount,string Email,string MailSubject,string MailBody)
        {

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

                MailMessage mm = new MailMessage(MailFromAccount, Email, MailSubject, MailBody);
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
    }

}