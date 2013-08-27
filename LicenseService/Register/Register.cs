using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Text;
using System.Data.SqlClient;
using System.Net.Mail;
using System.Xml;
using System.IO;

namespace Register
{

    public class RegisterUtil
    {
        private byte[] SetupFile = null;
        private SqlConnection SQLCon = null;
        private string Domain = "register.forerunnersw.com";

        private class RegistrationData
        {
            public string Email = "";
            public string FirstName = "";
            public string LastName = "";
            public string CompanyName = "";
            public string ID = "";

            public RegistrationData(Stream XMLData)
            {
                Read(new XmlTextReader(XMLData));

            }

            public string GetXML()
            {
                string XML = "<Registration>";
                XML += "<ID>" + ID + "</ID>";
                XML += "<Email>" + Email + "</Email>";
                XML += "<FirstName>" + FirstName + "</FirstName>";
                XML += "<LastName>" + LastName + "</LastName>";
                XML += "<CompanyName>" + CompanyName + "</CompanyName>";
                XML += "</Registration>";

                return XML;
            }
            public void SetID(string ID)
            {
                this.ID = ID;
            }
            public RegistrationData(XmlReader XMLData)
            {
                Read(XMLData);
            }
            private void Read(XmlReader XMLData)
            {
                XMLData.Read();

                if (XMLData.Name != "Registration")
                    return;

                XMLData.Read();
                bool NotDone = true;
                while (NotDone)
                {
                    switch (XMLData.Name)
                    {
                        case "ID":
                            ID = XMLData.ReadElementContentAsString();
                            break;
                        case "Email":
                            Email = XMLData.ReadElementContentAsString();
                            break;
                        case "FirstName":
                            FirstName = XMLData.ReadElementContentAsString();
                            break;
                        case "LastName":
                            LastName = XMLData.ReadElementContentAsString();
                            break;
                        case "CompanyName":
                            CompanyName = XMLData.ReadElementContentAsString();
                            break;
                        default:
                            NotDone = false;
                            break;
                    }
                }
            }
        }

        private SqlConnection GetSQLCon()
        {
            if (SQLCon == null)
            {
                SQLCon = new SqlConnection();
                SqlConnectionStringBuilder builder = new SqlConnectionStringBuilder();
                builder.DataSource = "ncptkyx9og.database.windows.net";
                builder.InitialCatalog = "ForerunnerRegistration";
                builder.UserID = "Register";
                builder.Password = "RegUserPWD!";
                SQLCon.ConnectionString = builder.ConnectionString;
            }

            return SQLCon;
        }

        private string SendMail(RegistrationData RegData)
        {
#if DEBUG
            Domain = "127.0.0.1:81";
#endif

            string MailSubject = @"Thank you for registering for your FREE Trial";
            string MailBody =
@"<b>" + RegData.FirstName + @", thank you for registering for your FREE Trial!</b><br><br> 

To dowload your software click <a href='http://" + Domain + "/api/Download?id=" + RegData.ID + "'>here</a> or copy this link to your brower http://" + Domain + "/api/Download?id=" + RegData.ID + "<br><br>  Sincerely:<br> The Forerunner Software Team";

            try
            {
                SmtpClient client = new SmtpClient();
                client.Port = 587;
                client.Host = "outlook.office365.com";
                client.EnableSsl = true;
                client.Timeout = 50000;
                client.DeliveryMethod = SmtpDeliveryMethod.Network;
                client.UseDefaultCredentials = false;
                client.Credentials = new System.Net.NetworkCredential("ServiceAccount@forerunnersw.com", "ServicePWD!");

                MailMessage mm = new MailMessage("sales@forerunnersw.com", RegData.Email, MailSubject, MailBody);
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
        public string RegisterDownload(Stream XMLValue)
        {
            SqlConnection SQLConn = GetSQLCon();
            SqlDataReader SQLReader;
            Guid ID = Guid.NewGuid();
            RegistrationData RegData = new RegistrationData(XMLValue);

            string SQL = @" 
                            IF NOT EXISTS (SELECT * FROM TrialRegistration WHERE Email = @Email)
                                INSERT TrialRegistration (DownloadID, Email,FirstName,LastName,CompanyName,RegisterDate,DownloadAttempts,RegistrationAttempts) SELECT @ID,@Email,@FirstName,@LastName,@CompanyName,GetDate(),0,1
                            ELSE
                                UPDATE TrialRegistration SET RegistrationAttempts = RegistrationAttempts+1
                            SELECT DownloadID FROM TrialRegistration WHERE Email = @Email
                           ";
            SQLConn.Open();
            SqlCommand SQLComm = new SqlCommand(SQL, SQLConn);
            SQLComm.Parameters.AddWithValue("@ID", ID);
            SQLComm.Parameters.AddWithValue("@Email", RegData.Email);
            SQLComm.Parameters.AddWithValue("@FirstName", RegData.FirstName);
            SQLComm.Parameters.AddWithValue("@LastName", RegData.LastName);
            SQLComm.Parameters.AddWithValue("@CompanyName", RegData.CompanyName);

            SQLReader = SQLComm.ExecuteReader();
            string DownloadID = null;
            while (SQLReader.Read())
            {
                DownloadID = SQLReader.GetGuid(0).ToString();
            }
            SQLReader.Close();
            SQLConn.Close();

            RegData.SetID(DownloadID);
            SaveEmailTask(RegData);
            return DownloadID;

        }

        public bool ValidateDownload(string ID)
        {
            SqlConnection SQLConn = GetSQLCon();
            SqlDataReader SQLReader;

            string SQL = @" UPDATE TrialRegistration SET DownloadAttempts = DownloadAttempts+1 WHERE DownloadID = @ID
                            SELECT DownloadAttempts FROM TrialRegistration WHERE DownloadID = @ID
                           ";
            SQLConn.Open();
            SqlCommand SQLComm = new SqlCommand(SQL, SQLConn);
            SQLComm.Parameters.AddWithValue("@ID", new Guid(ID));

            SQLReader = SQLComm.ExecuteReader();
            int DownloadAttempts = -1;
            while (SQLReader.Read())
            {
                DownloadAttempts = SQLReader.GetInt32(0);
            }
            SQLReader.Close();
            SQLConn.Close();

            if (DownloadAttempts == -1 || DownloadAttempts > 10)
                return false;
            else
                return true;

        }


        public byte[] GetSetupFile()
        {
            if (SetupFile == null)
            {
                SetupFile = System.IO.File.ReadAllBytes(AppDomain.CurrentDomain.BaseDirectory + "/Content/ForerunnerReportManagerSetup.exe");
            }
            return SetupFile;
        }

        public void DoWork()
        {
            SqlConnection SQLConn = GetSQLCon();
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
                    RegistrationData RegData =new RegistrationData(SQLReader.GetXmlReader(2));

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
            SqlConnection SQLConn = GetSQLCon();
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

        private void SaveEmailTask(RegistrationData RegData)
        {

            SaveTask("SendRegistrationEmail", RegData.GetXML());
                
        }

    }
}