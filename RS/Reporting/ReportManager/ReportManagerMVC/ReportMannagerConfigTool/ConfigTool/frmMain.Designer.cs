namespace ReportMannagerConfigTool
{
    partial class frmMain
    {
        /// <summary>
        /// Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary>
        /// Clean up any resources being used.
        /// </summary>
        /// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Windows Form Designer generated code

        /// <summary>
        /// Required method for Designer support - do not modify
        /// the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            System.ComponentModel.ComponentResourceManager resources = new System.ComponentModel.ComponentResourceManager(typeof(frmMain));
            this.folderSSRS = new System.Windows.Forms.FolderBrowserDialog();
            this.tabMain = new System.Windows.Forms.TabControl();
            this.tabPage1 = new System.Windows.Forms.TabPage();
            this.btnApplyWebServer = new System.Windows.Forms.Button();
            this.lblPort = new System.Windows.Forms.Label();
            this.txtPort = new System.Windows.Forms.TextBox();
            this.lblSiteName = new System.Windows.Forms.Label();
            this.txtSiteName = new System.Windows.Forms.TextBox();
            this.rdoUWS = new System.Windows.Forms.RadioButton();
            this.rdoIIS = new System.Windows.Forms.RadioButton();
            this.tabPage2 = new System.Windows.Forms.TabPage();
            this.groupBox1 = new System.Windows.Forms.GroupBox();
            this.lblDomain = new System.Windows.Forms.Label();
            this.txtDomain = new System.Windows.Forms.TextBox();
            this.label1 = new System.Windows.Forms.Label();
            this.txtPWD = new System.Windows.Forms.TextBox();
            this.label2 = new System.Windows.Forms.Label();
            this.txtUser = new System.Windows.Forms.TextBox();
            this.rdoSQL = new System.Windows.Forms.RadioButton();
            this.rdoDomain = new System.Windows.Forms.RadioButton();
            this.lblWSUrl = new System.Windows.Forms.Label();
            this.txtWSUrl = new System.Windows.Forms.TextBox();
            this.lblDBName = new System.Windows.Forms.Label();
            this.txtDBName = new System.Windows.Forms.TextBox();
            this.lblServer = new System.Windows.Forms.Label();
            this.txtServerName = new System.Windows.Forms.TextBox();
            this.btnTest = new System.Windows.Forms.Button();
            this.btnApply = new System.Windows.Forms.Button();
            this.tabPage3 = new System.Windows.Forms.TabPage();
            this.textBox1 = new System.Windows.Forms.TextBox();
            this.btnRemoveEx = new System.Windows.Forms.Button();
            this.btnAddEx = new System.Windows.Forms.Button();
            this.btnFolderBrowser = new System.Windows.Forms.Button();
            this.lblReportServer = new System.Windows.Forms.Label();
            this.txtReportServer = new System.Windows.Forms.TextBox();
            this.tabMain.SuspendLayout();
            this.tabPage1.SuspendLayout();
            this.tabPage2.SuspendLayout();
            this.groupBox1.SuspendLayout();
            this.tabPage3.SuspendLayout();
            this.SuspendLayout();
            // 
            // tabMain
            // 
            this.tabMain.Controls.Add(this.tabPage1);
            this.tabMain.Controls.Add(this.tabPage2);
            this.tabMain.Controls.Add(this.tabPage3);
            resources.ApplyResources(this.tabMain, "tabMain");
            this.tabMain.Name = "tabMain";
            this.tabMain.SelectedIndex = 0;
            // 
            // tabPage1
            // 
            this.tabPage1.Controls.Add(this.btnApplyWebServer);
            this.tabPage1.Controls.Add(this.lblPort);
            this.tabPage1.Controls.Add(this.txtPort);
            this.tabPage1.Controls.Add(this.lblSiteName);
            this.tabPage1.Controls.Add(this.txtSiteName);
            this.tabPage1.Controls.Add(this.rdoUWS);
            this.tabPage1.Controls.Add(this.rdoIIS);
            resources.ApplyResources(this.tabPage1, "tabPage1");
            this.tabPage1.Name = "tabPage1";
            this.tabPage1.UseVisualStyleBackColor = true;
            // 
            // btnApplyWebServer
            // 
            resources.ApplyResources(this.btnApplyWebServer, "btnApplyWebServer");
            this.btnApplyWebServer.Name = "btnApplyWebServer";
            this.btnApplyWebServer.UseVisualStyleBackColor = true;
            this.btnApplyWebServer.Click += new System.EventHandler(this.btnApplyWebServer_Click);
            // 
            // lblPort
            // 
            resources.ApplyResources(this.lblPort, "lblPort");
            this.lblPort.Name = "lblPort";
            // 
            // txtPort
            // 
            resources.ApplyResources(this.txtPort, "txtPort");
            this.txtPort.Name = "txtPort";
            // 
            // lblSiteName
            // 
            resources.ApplyResources(this.lblSiteName, "lblSiteName");
            this.lblSiteName.Name = "lblSiteName";
            // 
            // txtSiteName
            // 
            resources.ApplyResources(this.txtSiteName, "txtSiteName");
            this.txtSiteName.Name = "txtSiteName";
            // 
            // rdoUWS
            // 
            resources.ApplyResources(this.rdoUWS, "rdoUWS");
            this.rdoUWS.Name = "rdoUWS";
            this.rdoUWS.UseVisualStyleBackColor = true;
            // 
            // rdoIIS
            // 
            resources.ApplyResources(this.rdoIIS, "rdoIIS");
            this.rdoIIS.Checked = true;
            this.rdoIIS.Name = "rdoIIS";
            this.rdoIIS.TabStop = true;
            this.rdoIIS.UseVisualStyleBackColor = true;
            // 
            // tabPage2
            // 
            this.tabPage2.Controls.Add(this.groupBox1);
            this.tabPage2.Controls.Add(this.lblWSUrl);
            this.tabPage2.Controls.Add(this.txtWSUrl);
            this.tabPage2.Controls.Add(this.lblDBName);
            this.tabPage2.Controls.Add(this.txtDBName);
            this.tabPage2.Controls.Add(this.lblServer);
            this.tabPage2.Controls.Add(this.txtServerName);
            this.tabPage2.Controls.Add(this.btnTest);
            this.tabPage2.Controls.Add(this.btnApply);
            resources.ApplyResources(this.tabPage2, "tabPage2");
            this.tabPage2.Name = "tabPage2";
            this.tabPage2.UseVisualStyleBackColor = true;
            // 
            // groupBox1
            // 
            this.groupBox1.Controls.Add(this.lblDomain);
            this.groupBox1.Controls.Add(this.txtDomain);
            this.groupBox1.Controls.Add(this.label1);
            this.groupBox1.Controls.Add(this.txtPWD);
            this.groupBox1.Controls.Add(this.label2);
            this.groupBox1.Controls.Add(this.txtUser);
            this.groupBox1.Controls.Add(this.rdoSQL);
            this.groupBox1.Controls.Add(this.rdoDomain);
            resources.ApplyResources(this.groupBox1, "groupBox1");
            this.groupBox1.Name = "groupBox1";
            this.groupBox1.TabStop = false;
            // 
            // lblDomain
            // 
            resources.ApplyResources(this.lblDomain, "lblDomain");
            this.lblDomain.Name = "lblDomain";
            // 
            // txtDomain
            // 
            resources.ApplyResources(this.txtDomain, "txtDomain");
            this.txtDomain.Name = "txtDomain";
            this.txtDomain.Tag = "Domain";
            // 
            // label1
            // 
            resources.ApplyResources(this.label1, "label1");
            this.label1.Name = "label1";
            // 
            // txtPWD
            // 
            resources.ApplyResources(this.txtPWD, "txtPWD");
            this.txtPWD.Name = "txtPWD";
            this.txtPWD.Tag = "Password";
            // 
            // label2
            // 
            resources.ApplyResources(this.label2, "label2");
            this.label2.Name = "label2";
            // 
            // txtUser
            // 
            resources.ApplyResources(this.txtUser, "txtUser");
            this.txtUser.Name = "txtUser";
            this.txtUser.Tag = "User Name";
            // 
            // rdoSQL
            // 
            resources.ApplyResources(this.rdoSQL, "rdoSQL");
            this.rdoSQL.Name = "rdoSQL";
            this.rdoSQL.TabStop = true;
            this.rdoSQL.UseVisualStyleBackColor = true;
            this.rdoSQL.CheckedChanged += new System.EventHandler(this.rdoSQL_CheckedChanged);
            // 
            // rdoDomain
            // 
            resources.ApplyResources(this.rdoDomain, "rdoDomain");
            this.rdoDomain.Checked = true;
            this.rdoDomain.Name = "rdoDomain";
            this.rdoDomain.TabStop = true;
            this.rdoDomain.UseVisualStyleBackColor = true;
            // 
            // lblWSUrl
            // 
            resources.ApplyResources(this.lblWSUrl, "lblWSUrl");
            this.lblWSUrl.Name = "lblWSUrl";
            // 
            // txtWSUrl
            // 
            resources.ApplyResources(this.txtWSUrl, "txtWSUrl");
            this.txtWSUrl.Name = "txtWSUrl";
            this.txtWSUrl.Tag = "Report Server Web Service Url";
            // 
            // lblDBName
            // 
            resources.ApplyResources(this.lblDBName, "lblDBName");
            this.lblDBName.Name = "lblDBName";
            // 
            // txtDBName
            // 
            resources.ApplyResources(this.txtDBName, "txtDBName");
            this.txtDBName.Name = "txtDBName";
            this.txtDBName.Tag = "DB Name";
            // 
            // lblServer
            // 
            resources.ApplyResources(this.lblServer, "lblServer");
            this.lblServer.Name = "lblServer";
            // 
            // txtServerName
            // 
            resources.ApplyResources(this.txtServerName, "txtServerName");
            this.txtServerName.Name = "txtServerName";
            this.txtServerName.Tag = "Server Name";
            // 
            // btnTest
            // 
            resources.ApplyResources(this.btnTest, "btnTest");
            this.btnTest.Name = "btnTest";
            this.btnTest.UseVisualStyleBackColor = true;
            this.btnTest.Click += new System.EventHandler(this.btnTest_Click);
            // 
            // btnApply
            // 
            resources.ApplyResources(this.btnApply, "btnApply");
            this.btnApply.Name = "btnApply";
            this.btnApply.UseVisualStyleBackColor = true;
            this.btnApply.Click += new System.EventHandler(this.btnApply_Click);
            // 
            // tabPage3
            // 
            this.tabPage3.Controls.Add(this.textBox1);
            this.tabPage3.Controls.Add(this.btnRemoveEx);
            this.tabPage3.Controls.Add(this.btnAddEx);
            this.tabPage3.Controls.Add(this.btnFolderBrowser);
            this.tabPage3.Controls.Add(this.lblReportServer);
            this.tabPage3.Controls.Add(this.txtReportServer);
            resources.ApplyResources(this.tabPage3, "tabPage3");
            this.tabPage3.Name = "tabPage3";
            this.tabPage3.UseVisualStyleBackColor = true;
            // 
            // textBox1
            // 
            this.textBox1.BackColor = System.Drawing.SystemColors.Window;
            this.textBox1.BorderStyle = System.Windows.Forms.BorderStyle.None;
            resources.ApplyResources(this.textBox1, "textBox1");
            this.textBox1.Name = "textBox1";
            this.textBox1.ReadOnly = true;
            // 
            // btnRemoveEx
            // 
            resources.ApplyResources(this.btnRemoveEx, "btnRemoveEx");
            this.btnRemoveEx.Name = "btnRemoveEx";
            this.btnRemoveEx.UseVisualStyleBackColor = true;
            this.btnRemoveEx.Click += new System.EventHandler(this.btnRemoveEx_Click);
            // 
            // btnAddEx
            // 
            resources.ApplyResources(this.btnAddEx, "btnAddEx");
            this.btnAddEx.Name = "btnAddEx";
            this.btnAddEx.UseVisualStyleBackColor = true;
            this.btnAddEx.Click += new System.EventHandler(this.btnAddEx_Click);
            // 
            // btnFolderBrowser
            // 
            resources.ApplyResources(this.btnFolderBrowser, "btnFolderBrowser");
            this.btnFolderBrowser.Name = "btnFolderBrowser";
            this.btnFolderBrowser.UseVisualStyleBackColor = true;
            this.btnFolderBrowser.Click += new System.EventHandler(this.btnFolderBrowser_Click);
            // 
            // lblReportServer
            // 
            resources.ApplyResources(this.lblReportServer, "lblReportServer");
            this.lblReportServer.Name = "lblReportServer";
            // 
            // txtReportServer
            // 
            resources.ApplyResources(this.txtReportServer, "txtReportServer");
            this.txtReportServer.Name = "txtReportServer";
            // 
            // frmMain
            // 
            resources.ApplyResources(this, "$this");
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.Controls.Add(this.tabMain);
            this.FormBorderStyle = System.Windows.Forms.FormBorderStyle.FixedDialog;
            this.MaximizeBox = false;
            this.Name = "frmMain";
            this.tabMain.ResumeLayout(false);
            this.tabPage1.ResumeLayout(false);
            this.tabPage1.PerformLayout();
            this.tabPage2.ResumeLayout(false);
            this.tabPage2.PerformLayout();
            this.groupBox1.ResumeLayout(false);
            this.groupBox1.PerformLayout();
            this.tabPage3.ResumeLayout(false);
            this.tabPage3.PerformLayout();
            this.ResumeLayout(false);

        }

        #endregion

        private System.Windows.Forms.FolderBrowserDialog folderSSRS;
        private System.Windows.Forms.TabControl tabMain;
        private System.Windows.Forms.TabPage tabPage1;
        private System.Windows.Forms.Button btnApplyWebServer;
        private System.Windows.Forms.Label lblPort;
        private System.Windows.Forms.TextBox txtPort;
        private System.Windows.Forms.Label lblSiteName;
        private System.Windows.Forms.TextBox txtSiteName;
        private System.Windows.Forms.RadioButton rdoUWS;
        private System.Windows.Forms.RadioButton rdoIIS;
        private System.Windows.Forms.TabPage tabPage2;
        private System.Windows.Forms.Label lblDBName;
        private System.Windows.Forms.TextBox txtDBName;
        private System.Windows.Forms.Label lblServer;
        private System.Windows.Forms.TextBox txtServerName;
        private System.Windows.Forms.Button btnTest;
        private System.Windows.Forms.Label lblDomain;
        private System.Windows.Forms.TextBox txtDomain;
        private System.Windows.Forms.Button btnApply;
        private System.Windows.Forms.Label label1;
        private System.Windows.Forms.TextBox txtPWD;
        private System.Windows.Forms.Label label2;
        private System.Windows.Forms.TextBox txtUser;
        private System.Windows.Forms.RadioButton rdoSQL;
        private System.Windows.Forms.RadioButton rdoDomain;
        private System.Windows.Forms.TabPage tabPage3;
        private System.Windows.Forms.Button btnRemoveEx;
        private System.Windows.Forms.Button btnAddEx;
        private System.Windows.Forms.Button btnFolderBrowser;
        private System.Windows.Forms.Label lblReportServer;
        private System.Windows.Forms.TextBox txtReportServer;
        private System.Windows.Forms.Label lblWSUrl;
        private System.Windows.Forms.TextBox txtWSUrl;
        private System.Windows.Forms.TextBox textBox1;
        private System.Windows.Forms.GroupBox groupBox1;
    }
}

