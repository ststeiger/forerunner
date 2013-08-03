using System;
using System.Linq;
using System.Data;
using System.Data.SqlClient;
using System.IO;
using System.Net;
using System.Windows.Forms;
using Microsoft.Win32;
using System.Net.Sockets;

namespace ReportMannagerConfigTool
{
    public partial class frmMain : Form
    {
        public frmMain()
        {
            InitializeComponent();
        }

        #region Deploy Web Server
        //Deploy site to web server
        private void btnApplyWebServer_Click(object sender, EventArgs e)
        {
            #region Detect IIS or UWS is installed.
            if (rdoIIS.Checked)
            {
                if (!isIISInstalled())
                {
                    showWarning("Please install IIS Web Server first before deploy.");
                    return;
                }
            }

            if (rdoUWS.Checked)
            {
                if (!isUWSInstalled())
                {
                    showWarning("Please install UWS Web Server first before deploy.");
                    return;
                }
            }
            #endregion

            if (txtSiteName.Text.Trim().Equals(string.Empty))
            {
                showWarning("Site Name can not be empty!");
                return;
            }

            if (txtPort.Text.Trim().Equals(string.Empty))
            {
                showWarning("Port can not be empty!");
                return;
            }

            try
            {
                string bindingAddress = string.Empty;
                //get local ip address
                string ip = GetLocIP();
                string localDirectory = Environment.CurrentDirectory;
                string siteName = txtSiteName.Text.Trim();
                string port = txtPort.Text.Trim();

                //deploy site to IIS web server
                if (rdoIIS.Checked)
                {
                    //ip:port:domain
                    bindingAddress = string.Format("{0}:{1}:{2}", ip, port, "");
                    ReportManagerConfig.CreateAnIISSite(siteName, localDirectory, bindingAddress);
                }
                //deploy site to UWS web server
                else if (rdoUWS.Checked)
                {
                    bindingAddress = string.Format("http://{0}:{1}", ip, port);
                    ReportManagerConfig.CreateAnUWSSite(siteName, localDirectory, bindingAddress);
                }
            }
            catch (Exception ex)
            {
                showWarning("Error:" + ex.Message);
            }

            showMessage("Deploy to " + (rdoIIS.Checked ? "IIS " : "UWS") + " success!");
        }
        #endregion

        #region SSRS Connection
        private void btnTest_Click(object sender, EventArgs e)
        {
            if (!verifySSRSConnection())
                return;

            SqlConnectionStringBuilder builder = new SqlConnectionStringBuilder();
            builder.DataSource = getValue(txtServerName);
            builder.InitialCatalog = getValue(txtDBName);
            if (rdoDomain.Checked)
            {
                builder.UserID = getValue(txtDomain) + "\\" + getValue(txtUser);
            }
            else
            {
                builder.UserID = getValue(txtUser);
            }

            builder.Password = getValue(txtPWD);

            string result = tryConnectDB(builder.ConnectionString);
            if (result.Equals("True"))
                showMessage("Connected test success!");
            else
                MessageBox.Show(result);
        }

        private void btnApply_Click(object sender, EventArgs e)
        {
            if (!verifySSRSConnection())
                return;
            try
            {
                ReportManagerConfig.UpdateForerunnerWebConfig(getValue(txtWSUrl), getValue(txtServerName), getValue(txtDBName),
                    getValue(txtDomain), getValue(txtUser), getValue(txtPWD));

                showMessage("SSRS Connection config file update success!");
            }
            catch
            {
                showWarning("Error occured when update, please try later!");
            }
        }

        private void rdoSQL_CheckedChanged(object sender, EventArgs e)
        {
            if (rdoSQL.Checked == true)
                txtDomain.Enabled = false;
            else
                txtDomain.Enabled = true;
        }
        #endregion

        #region SSRS Extension
        private void btnFolderBrowser_Click(object sender, EventArgs e)
        {
            folderSSRS.ShowDialog();
            if (folderSSRS.SelectedPath != "")
                txtReportServer.Text = folderSSRS.SelectedPath;
        }

        private void btnRemoveEx_Click(object sender, EventArgs e)
        {
            string targetPath = getValue(txtReportServer);
            if (targetPath.Equals(string.Empty))
            {
                showWarning("Please select report server folder!");
                return;
            }

            if (VerifyReportServerPath(targetPath))
            {
                DialogResult dialogResult = MessageBox.Show("Are you sure to remove Render Extensions configuration?", "Remove", MessageBoxButtons.YesNo, MessageBoxIcon.Question);
                if (dialogResult == DialogResult.Yes)
                {
                    RenderExtensionConfig.removeRenderExtensionDLL(targetPath + "/bin");

                    if (!RenderExtensionConfig.removeWebConfig(targetPath))
                        showWarning("Remove render extension from web.config occured unknown error");

                    if (!RenderExtensionConfig.removeRSReportServerConfig(targetPath))
                        showWarning("Remove render extension from rsreportserver.config occured unknown error");

                    if (!RenderExtensionConfig.removeRSPolicyConfig(targetPath))
                        showWarning("Remove render extension from rsreportserver.config occured unknown error");
                }
                showMessage("Remove completed!");
            }
            else
            {
                showWarning("Please make sure 'Web.config', 'rsreportserver.config', 'rssrvpolicy.config' and 'bin' folder are all exist in selected folder!");
                return;
            }
        }

        private void btnAddEx_Click(object sender, EventArgs e)
        {            
            string targetPath = getValue(txtReportServer);
            if (targetPath.Equals(string.Empty))
            {
                showWarning("Please select report server folder!");
                return;
            }

            if (VerifyReportServerPath(targetPath))
            {
                //Copy Files to bin Folder
                RenderExtensionConfig.copyRenderExtensionDLL(targetPath + "/bin");

                //Add settings to Web.config
                if (!RenderExtensionConfig.updateWebConfig(targetPath))
                    showWarning("Update web.config occured unknown error");

                //Add settings to rsreportserver.config
                if(!RenderExtensionConfig.updateRSReportServerConfig(targetPath))
                    showWarning("Update rsreportserver.config occured unknown error");

                //Add setting to rsrvvpolicy.config
                if(!RenderExtensionConfig.updateRSPolicyConfig(targetPath))
                    showWarning("Update rsrvvpolicy.config occured unknown error");

                showMessage("Update completed!");
            }
            else
            {
                showWarning("Please make sure 'Web.config', 'rsreportserver.config', 'rssrvpolicy.config' and 'bin' folder are all exist in selected folder!");
                return;
            }
        }
        #endregion

        #region Utility
        /// <summary>
        /// Verify the control empty or not in tab 'SSRS Connection'
        /// 
        /// For the first empty control will break the function and popup error.
        /// </summary>
        /// <returns></returns>
        private bool verifySSRSConnection()
        {
            foreach (Control control in tabPage2.Controls)
            {
                if (control.Enabled && control is TextBox)
                {
                    var txt = (TextBox)control;
                    if (txt.Text.Trim().Equals(string.Empty))
                    {
                        showWarning(txt.Tag.ToString() + " can not be empty!");
                        return false;
                    }
                }
            }

            return true;
        }

        /// <summary>
        /// Show normal message
        /// </summary>
        /// <param name="message">message to show</param>
        private void showMessage(string message)
        {
            MessageBox.Show(message, "Notice", MessageBoxButtons.OK, MessageBoxIcon.Asterisk);
        }

        /// <summary>
        /// Show warning message with specific format
        /// </summary>
        /// <param name="message">warning message</param>
        private void showWarning(string message)
        {
            MessageBox.Show(message, "Warning", MessageBoxButtons.OK, MessageBoxIcon.Warning);
        }

        /// <summary>
        /// Get value from a TextBox control
        /// </summary>
        /// <param name="textbox">target control</param>
        /// <returns>text value after Trim()</returns>
        private string getValue(TextBox textbox)
        {
            return textbox.Text.Trim();
        }

        /// <summary>
        /// Verify whether program can connect database with given connection string.
        /// </summary>
        /// <param name="connectionString">given connection string</param>
        /// <returns>wheter can connect</returns>
        private string tryConnectDB(string connectionString)
        {
            SqlConnection conn = new SqlConnection(connectionString);
            try
            {
                conn.Open();
            }
            catch(Exception error)
            {
                return error.Message;
            }
            finally
            {
                if (conn.State == ConnectionState.Open)
                    conn.Close();
            }

            return "True";
        }

        /// <summary>
        /// Detect whether IIS web server installed on the machine
        /// </summary>
        /// <returns>True: installed; False: not</returns>
        private bool isIISInstalled()
        {
            //SOFTWARE\Microsoft\InetStp -- MajorVersion
            string[] valueNames;

            RegistryKey target = Registry.LocalMachine.OpenSubKey("SOFTWARE").OpenSubKey("Microsoft").OpenSubKey("InetStp");

            if (target == null)
                return false;

            valueNames = target.GetValueNames();
            foreach (string keyName in valueNames)
            {
                if (keyName == "MajorVersion")
                {
                    return true;
                }
            }

            return false;
        }

        /// <summary>
        /// Detect whether UWS web server installed on the machine
        /// </summary>
        /// <returns>True: installed; False: not</returns>
        private bool isUWSInstalled()
        {
            //SYSTEM\CurrentControlSet\services\UltiDev Web Server Pro" "Start"
            string[] valueNames;

            RegistryKey target = Registry.LocalMachine.OpenSubKey("SYSTEM").OpenSubKey("CurrentControlSet").OpenSubKey("services").OpenSubKey("UltiDev Web Server Pro");

            if (target == null)
                return false;

            valueNames = target.GetValueNames();
            foreach (string name in valueNames)
            {
                if (name == "Start")
                    return true;
            }

            return false;
        }

        private string GetLocIP()
        {
            IPHostEntry IpEntry = Dns.GetHostEntry(Dns.GetHostName());
            return IpEntry.AddressList.First(a => a.AddressFamily == AddressFamily.InterNetwork).ToString();
        }

        private bool VerifyReportServerPath(string targetPath)
        {
            if (File.Exists(targetPath + RenderExtensionConfig.webConfig) &&
                   File.Exists(targetPath + RenderExtensionConfig.rsConfig) &&
                   File.Exists(targetPath + RenderExtensionConfig.srvPolicyConfig) &&
                   Directory.Exists(targetPath + "/bin"))
            {
                return true;
            }
            else
                return false;
        }
        #endregion
    }
}
