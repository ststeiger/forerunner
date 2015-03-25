using System.Threading.Tasks;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Data.SqlClient;
using System.Xml;
using System.IO;

using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Web;
using System.Text;
using ForerunnerWebService;
using System.Xml.Serialization;

namespace ForerunnerRegister
{
     public class RegistrationData
        {
            public string Email = "";
            public string FirstName = "";
            public string LastName = "";
            public string CompanyName = "";
            public string ID = "";
            public string LicenseID = "";
            public string PhoneNumber = "";
            public string zip = "";  //This is bot check, if there is a zip it is a bot
            public string referrer = "";

            public RegistrationData(Stream XMLData)
            {
                Read(new XmlTextReader(XMLData));

            }

            public string GetXML()
            {
                string XML = "<Registration>";
                XML += "<ID>" + ID + "</ID>";
                XML += "<Email>" +HttpUtility.HtmlEncode(  Email) + "</Email>";
                XML += "<FirstName>" + HttpUtility.HtmlEncode( FirstName) + "</FirstName>";
                XML += "<LastName>" + HttpUtility.HtmlEncode( LastName) + "</LastName>";
                XML += "<CompanyName>" + HttpUtility.HtmlEncode( CompanyName) + "</CompanyName>";
                XML += "<PhoneNumber>" + HttpUtility.HtmlEncode( PhoneNumber) + "</PhoneNumber>";
                XML += "<LicenseID>" + LicenseID + "</LicenseID>";
                XML += "</Registration>";

                return XML;
            }
            public RegistrationData()
            {
                this.ID = Guid.NewGuid().ToString();
            }
            
            public void SetID(string ID)
            {
                this.ID = ID;
            }
            public RegistrationData(XmlReader XMLData)
            {
                Read(XMLData);
            }
            public RegistrationData(String Data)
            {
                string[] del = { "&", "=" };
                string[] parts = Data.Split(del, System.StringSplitOptions.None);

                for (int i = 0; i < parts.Length; i++)
                {
                    switch (parts[i].ToLower())
                    {
                        case "id":
                            ID = HttpUtility.UrlDecode(parts[++i]);
                            break;
                        case "email":
                            Email = HttpUtility.UrlDecode(parts[++i]);
                            break;
                        case "firstname":
                            FirstName = HttpUtility.UrlDecode(parts[++i]);
                            break;
                        case "lastname":
                            LastName = HttpUtility.UrlDecode(parts[++i]);
                            break;
                        case "companyname":
                            CompanyName = HttpUtility.UrlDecode(parts[++i]);
                            break;
                        case "phonenumber":
                            PhoneNumber = HttpUtility.UrlDecode(parts[++i]);
                            break;
                        case "zipcode":
                            zip = HttpUtility.UrlDecode(parts[++i]);
                            break;
                        case "referrer":
                            referrer = HttpUtility.UrlDecode(parts[++i]);
                            break;
                    }
                }
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
                        case "PhoneNumber":
                            PhoneNumber = XMLData.ReadElementContentAsString();
                            break;
                        case "ZipCode":
                            zip = XMLData.ReadElementContentAsString();
                            break;
                        case "referrer":
                            referrer = XMLData.ReadElementContentAsString();
                            break;
                        case "LicenseID":
                            LicenseID = XMLData.ReadElementContentAsString();
                            break;
                        default:
                            NotDone = false;
                            break;
                    }
                }
            }
        }


    public class Register
    {
        private static string Domain = ConfigurationManager.AppSettings["Domain"];
        private static string MailSubject = ConfigurationManager.AppSettings["RegMailSubject"];
        private static string MailBody = ConfigurationManager.AppSettings["RegMailBody"];
        private static string RegMailFromAccount = ConfigurationManager.AppSettings["RegMailFromAccount"];

        private static string SalesMailBody = ConfigurationManager.AppSettings["SalesNotifyMailBody"];

        private byte[] SetupFile = null;
  
        public string RegisterDownload(String Value)
        {
            return RegisterDownload(new RegistrationData(Value));
        }

        public string RegisterDownload(Stream XMLValue)
        {
            return RegisterDownload(new RegistrationData(XMLValue));
        }
        internal string RegisterDownload(RegistrationData RegData)
        {
            ForerunnerDB DB = new ForerunnerDB();
            SqlConnection SQLConn = DB.GetSQLConn();
            SqlCommand SQLComm;

            //Check for bot
            if (RegData.zip.Trim() != "" || RegData.CompanyName.Trim().ToLower() == "carrefour")
            {
                SQLConn.Open();
                SQLComm = new SqlCommand("INSERT BotReg (email,CreateDate) SELECT @Email,GETDATE()", SQLConn);
                SQLComm.Parameters.AddWithValue("@Email", RegData.Email);
                SQLComm.ExecuteNonQuery();
                SQLConn.Close();
                return "";
            }

            if (RegData.Email.Trim() != "")
            {

                SqlDataReader SQLReader;
                Guid ID = Guid.NewGuid();
                RegData.LicenseID = ForerunnerDB.NewLicenseID();

                string SQL = @" 
                            IF NOT EXISTS (SELECT * FROM TrialRegistration WHERE Email = @Email)
                                INSERT TrialRegistration (DownloadID, Email,FirstName,LastName,CompanyName,RegisterDate,DownloadAttempts,RegistrationAttempts,MaxDownloadAttempts,LicenseID,PhoneNumber,Referrer) SELECT @ID,@Email,@FirstName,@LastName,@CompanyName,GetDate(),0,1,3,@LicenseID,@PhoneNumber,@Referrer
                            ELSE
                                UPDATE TrialRegistration SET RegistrationAttempts = RegistrationAttempts+1 WHERE Email = @Email
                            SELECT DownloadID,LicenseID FROM TrialRegistration WHERE Email = @Email
                           ";
                SQLConn.Open();
                SQLComm = new SqlCommand(SQL, SQLConn);
                SQLComm.Parameters.AddWithValue("@ID", ID);
                SQLComm.Parameters.AddWithValue("@Email", RegData.Email);
                SQLComm.Parameters.AddWithValue("@FirstName", RegData.FirstName);
                SQLComm.Parameters.AddWithValue("@LastName", RegData.LastName);
                SQLComm.Parameters.AddWithValue("@CompanyName", RegData.CompanyName);
                SQLComm.Parameters.AddWithValue("@PhoneNumber", RegData.PhoneNumber);
                SQLComm.Parameters.AddWithValue("@LicenseID", RegData.LicenseID);
                SQLComm.Parameters.AddWithValue("@Referrer", RegData.referrer);


                SQLReader = SQLComm.ExecuteReader();
                string DownloadID = null;
                while (SQLReader.Read())
                {
                    DownloadID = SQLReader.GetGuid(0).ToString();
                    RegData.LicenseID = SQLReader.GetString(1);
                }
                SQLReader.Close();
                SQLConn.Close();

                RegData.SetID(DownloadID);
                new Order().WriteLicense(DownloadID, "MobTrial", "Mobilizer Trial", 100, RegData.LicenseID);
                SaveEmailTask(RegData);
                return DownloadID;
            }
            return "";

        }

        public void SavePageView(string UserID, string Page, string referer, string IP)
        {
            ForerunnerDB DB = new ForerunnerDB();
            SqlConnection SQLConn = DB.GetSQLConn();
            SqlCommand SQLComm;

            try
            {            
                SQLConn.Open();
                SQLComm = new SqlCommand("INSERT WebSiteTraffic (UserID ,IP, Referer, WSPage, VisitTime)  SELECT @ID,@IP,@Referer, @Page,GETDATE()", SQLConn);
                SQLComm.Parameters.AddWithValue("@ID", UserID);
                SQLComm.Parameters.AddWithValue("@IP", IP);
                SQLComm.Parameters.AddWithValue("@Referer", referer);
                SQLComm.Parameters.AddWithValue("@Page", Page);
                SQLComm.ExecuteNonQuery();
                SQLConn.Close();
            }
            catch (Exception /*e*/)
            {
                SQLConn.Close();
            }

        }

        public void SaveEmailOpen(string ID, string email)
        {
            ForerunnerDB DB = new ForerunnerDB();
            SqlConnection SQLConn = DB.GetSQLConn();
            SqlCommand SQLComm;

            try
            {
                SQLConn.Open();
                SQLComm = new SqlCommand("INSERT campaignOpens (ID ,email, actionDate)  SELECT @ID,@email,GETDATE()", SQLConn);
                SQLComm.Parameters.AddWithValue("@ID", ID);
                SQLComm.Parameters.AddWithValue("@email", email);
                SQLComm.ExecuteNonQuery();
                SQLConn.Close();
            }
            catch (Exception /*e*/)
            {
                SQLConn.Close();
            }

        }

        public void NoThankYou(string email)
        {
            ForerunnerDB DB = new ForerunnerDB();
            SqlConnection SQLConn = DB.GetSQLConn();
            SqlCommand SQLComm;

            try
            {
                SQLConn.Open();
                SQLComm = new SqlCommand("delete campaignlist where email = @email INSERT NoThankYou (email,NoDate) SELECT @email, GETDATE()", SQLConn);                
                SQLComm.Parameters.AddWithValue("@email", email);
                SQLComm.ExecuteNonQuery();
                SQLConn.Close();
            }
            catch (Exception /*e*/)
            {
                SQLConn.Close();
            }

        }

        public class campaign { public string ID; public string ListID;}

        public string RunCampaign(XmlReader XMLData, TaskWorker tw)
        {
            ForerunnerDB DB = new ForerunnerDB();
            SqlConnection SQLConn = DB.GetSQLConn();
            SqlCommand SQLComm; 
            SqlDataReader SQLReader;
            string email;
            string content;
            string subject;
            string company;
            string name;
            string from;
            string fromPWD;

            try
            {
                campaign c = (campaign)new XmlSerializer(typeof(campaign)).Deserialize(XMLData);
                SQLConn.Open();
                SQLComm = new SqlCommand("select content,subject,fromEmail,fromPWD from campaign where id = @ID", SQLConn);
                SQLComm.Parameters.AddWithValue("@ID", c.ID);
                SQLReader = SQLComm.ExecuteReader();

                SQLReader.Read();
                content = SQLReader.GetString(0);
                subject = SQLReader.GetString(1);
                from = SQLReader.GetString(2);
                fromPWD = SQLReader.GetString(3);
                SQLReader.Close();


                SQLComm = new SqlCommand("select email,company,name from campaignList where ListID = @ListID", SQLConn);
                SQLComm.Parameters.AddWithValue("@ListID", c.ListID);
                SQLReader = SQLComm.ExecuteReader();

                while (SQLReader.Read())
                {                    
                    email = SQLReader.GetString(0);
                    company = SQLReader.GetString(1);
                    name = SQLReader.GetString(2);
                    
                    tw.SendMail(from, email, subject, string.Format(content,company,email,name),from,fromPWD);
                    System.Threading.Thread.Sleep(3000);
                }
                SQLReader.Close();


                SQLConn.Close();
            }


            catch (Exception /*e*/)
            {
                if (SQLConn.State == System.Data.ConnectionState.Open)
                {
                    SQLConn.Close();
                }
                return "fail";
            }
            return "success";
        }

        public string SendRegisterMail(XmlReader XMLReg,TaskWorker tw)
        {
#if DEBUG
                Domain = "localhost";
#endif
            RegistrationData RegData = new RegistrationData(XMLReg);
            string NewMailBody;
            
            
            NewMailBody = String.Format(SalesMailBody, RegData.Email,RegData.PhoneNumber,RegData.FirstName,RegData.LastName,RegData.CompanyName,RegData.referrer);
            tw.SendMail(RegMailFromAccount, "Sales@forerunnersw.com", "New Trial Registration", NewMailBody);

            NewMailBody = String.Format(MailBody, RegData.FirstName, RegData.LicenseID);

            tw.SendMail(RegMailFromAccount, "Archive@forerunnersw.com", MailSubject, NewMailBody);
            return tw.SendMail(RegMailFromAccount, RegData.Email, MailSubject, NewMailBody);

        }

        public byte[] GetSetupFile()
        {
            if (SetupFile == null)
            {
                SetupFile = System.IO.File.ReadAllBytes(AppDomain.CurrentDomain.BaseDirectory + "/Content/ForerunnerMobilizerSetup.exe");
            }
            return SetupFile;
        }

        private void SaveEmailTask(RegistrationData RegData)
        {
            (new TaskWorker()).SaveTask("SendRegistrationEmail", RegData.GetXML());

        }

    }
}