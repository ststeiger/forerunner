using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.IO;
using System.Xml;
using System.Data.SqlClient;
using ForerunnerWebService;

namespace RegisterWebService
{
    public class AccountData
    {
        public string Email = "";
        public string FirstName = "";
        public string LastName = "";
        public string CompanyName = "";
        public string ID = "";
        public string PWD = "";

        public AccountData(Stream XMLData)
        {
            Read(new XmlTextReader(XMLData));
        }

        public string GetXML()
        {
            string XML = "<Account>";
            XML += "<ID>" + ID + "</ID>";
            XML += "<Email>" + Email + "</Email>";
            XML += "<FirstName>" + FirstName + "</FirstName>";
            XML += "<LastName>" + LastName + "</LastName>";
            XML += "<CompanyName>" + CompanyName + "</CompanyName>";
            XML += "<Password>" + PWD + "</Password>";
            XML += "</Account>";

            return XML;
        }
        public void SetID(string ID)
        {
            this.ID = ID;
        }
        public AccountData(XmlReader XMLData)
        {
            Read(XMLData);
        }
        public AccountData(String Data)
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
                    case "password":
                        CompanyName = HttpUtility.UrlDecode(parts[++i]);
                        break;
                }
            }
        }
        private void Read(XmlReader XMLData)
        {
            XMLData.Read();

            if (XMLData.Name != "Account")
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
                    case "Password":
                        CompanyName = XMLData.ReadElementContentAsString();
                        break;
                    default:
                        NotDone = false;
                        break;
                }
            }
        }
    }

    public class Account
    {
        public bool Save(string Value)
        {
            bool retval = true;
            AccountData ad = new AccountData(Value);
            ForerunnerDB DB = new ForerunnerDB();
            SqlConnection SQLConn = DB.GetSQLConn();
            ad.ID = Guid.NewGuid().ToString();

            string SQL = @" 
                            INSERT Account (AccountID, Email,FirstName,LastName,CompanyName,Password,CreateDate) SELECT @ID,@Email,@FirstName,@LastName,@CompanyName,@Password,GetDate()
                           ";
            SQLConn.Open();
            SqlCommand SQLComm = new SqlCommand(SQL, SQLConn);
            SQLComm.Parameters.AddWithValue("@ID", ad.ID);
            SQLComm.Parameters.AddWithValue("@Email", ad.Email);
            SQLComm.Parameters.AddWithValue("@FirstName", ad.FirstName);
            SQLComm.Parameters.AddWithValue("@LastName", ad.LastName);
            SQLComm.Parameters.AddWithValue("@CompanyName", ad.CompanyName);
            SQLComm.Parameters.AddWithValue("@Password", ad.PWD);

            try
            {
                SQLComm.ExecuteNonQuery();
                
            }
            catch (Exception e)
            {
                retval = false;
            }
            SQLConn.Close();
            return retval;
  
        }

        public string Login(string email, string password)
        {
            string AccountID = null;
            ForerunnerDB DB = new ForerunnerDB();
            SqlConnection SQLConn = DB.GetSQLConn();
            string SQL = @" 
                            SELECT AccountID,Password from Account WHERE Email = @Email
                           ";
            SQLConn.Open();
            SqlCommand SQLComm = new SqlCommand(SQL, SQLConn);
            SQLComm.Parameters.AddWithValue("@Email", email);

            try
            {
                SqlDataReader SQLReader = SQLComm.ExecuteReader();
                string StoredPWD = null;
                
                while (SQLReader.Read())
                {
                    StoredPWD = SQLReader.GetString(1);
                    AccountID = SQLReader.GetGuid(0).ToString();
                }
                SQLReader.Close();                
                if (password != StoredPWD || StoredPWD == null)
                    AccountID = null;

            }
            catch (Exception e)
            {
                
            }
            SQLConn.Close();
            return AccountID;
        }

    }
}