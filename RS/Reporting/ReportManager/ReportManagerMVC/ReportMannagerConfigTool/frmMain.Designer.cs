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
            this.tabPage2 = new System.Windows.Forms.TabPage();
            this.tabPage3 = new System.Windows.Forms.TabPage();
            this.btnApplyWebServer = new System.Windows.Forms.Button();
            this.lblPort = new System.Windows.Forms.Label();
            this.txtPort = new System.Windows.Forms.TextBox();
            this.lblvRoot = new System.Windows.Forms.Label();
            this.txtvRoot = new System.Windows.Forms.TextBox();
            this.rdoUMW = new System.Windows.Forms.RadioButton();
            this.rdoIIS = new System.Windows.Forms.RadioButton();
            this.lblDBName = new System.Windows.Forms.Label();
            this.txtDBName = new System.Windows.Forms.TextBox();
            this.lblServer = new System.Windows.Forms.Label();
            this.textBox3 = new System.Windows.Forms.TextBox();
            this.btnTest = new System.Windows.Forms.Button();
            this.lblDomain = new System.Windows.Forms.Label();
            this.textBox1 = new System.Windows.Forms.TextBox();
            this.button1 = new System.Windows.Forms.Button();
            this.label1 = new System.Windows.Forms.Label();
            this.txtPWD = new System.Windows.Forms.TextBox();
            this.label2 = new System.Windows.Forms.Label();
            this.txtUser = new System.Windows.Forms.TextBox();
            this.rdoSQL = new System.Windows.Forms.RadioButton();
            this.rdoDomain = new System.Windows.Forms.RadioButton();
            this.lblReportServer = new System.Windows.Forms.Label();
            this.txtReportServer = new System.Windows.Forms.TextBox();
            this.btnFolderBrowser = new System.Windows.Forms.Button();
            this.btnAddEx = new System.Windows.Forms.Button();
            this.btnRemoveEx = new System.Windows.Forms.Button();
            this.tabMain.SuspendLayout();
            this.tabPage1.SuspendLayout();
            this.tabPage2.SuspendLayout();
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
            this.tabPage1.Controls.Add(this.lblvRoot);
            this.tabPage1.Controls.Add(this.txtvRoot);
            this.tabPage1.Controls.Add(this.rdoUMW);
            this.tabPage1.Controls.Add(this.rdoIIS);
            resources.ApplyResources(this.tabPage1, "tabPage1");
            this.tabPage1.Name = "tabPage1";
            this.tabPage1.UseVisualStyleBackColor = true;
            // 
            // tabPage2
            // 
            this.tabPage2.Controls.Add(this.lblDBName);
            this.tabPage2.Controls.Add(this.txtDBName);
            this.tabPage2.Controls.Add(this.lblServer);
            this.tabPage2.Controls.Add(this.textBox3);
            this.tabPage2.Controls.Add(this.btnTest);
            this.tabPage2.Controls.Add(this.lblDomain);
            this.tabPage2.Controls.Add(this.textBox1);
            this.tabPage2.Controls.Add(this.button1);
            this.tabPage2.Controls.Add(this.label1);
            this.tabPage2.Controls.Add(this.txtPWD);
            this.tabPage2.Controls.Add(this.label2);
            this.tabPage2.Controls.Add(this.txtUser);
            this.tabPage2.Controls.Add(this.rdoSQL);
            this.tabPage2.Controls.Add(this.rdoDomain);
            resources.ApplyResources(this.tabPage2, "tabPage2");
            this.tabPage2.Name = "tabPage2";
            this.tabPage2.UseVisualStyleBackColor = true;
            // 
            // tabPage3
            // 
            this.tabPage3.Controls.Add(this.btnRemoveEx);
            this.tabPage3.Controls.Add(this.btnAddEx);
            this.tabPage3.Controls.Add(this.btnFolderBrowser);
            this.tabPage3.Controls.Add(this.lblReportServer);
            this.tabPage3.Controls.Add(this.txtReportServer);
            resources.ApplyResources(this.tabPage3, "tabPage3");
            this.tabPage3.Name = "tabPage3";
            this.tabPage3.UseVisualStyleBackColor = true;
            // 
            // btnApplyWebServer
            // 
            resources.ApplyResources(this.btnApplyWebServer, "btnApplyWebServer");
            this.btnApplyWebServer.Name = "btnApplyWebServer";
            this.btnApplyWebServer.UseVisualStyleBackColor = true;
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
            // lblvRoot
            // 
            resources.ApplyResources(this.lblvRoot, "lblvRoot");
            this.lblvRoot.Name = "lblvRoot";
            // 
            // txtvRoot
            // 
            resources.ApplyResources(this.txtvRoot, "txtvRoot");
            this.txtvRoot.Name = "txtvRoot";
            // 
            // rdoUMW
            // 
            resources.ApplyResources(this.rdoUMW, "rdoUMW");
            this.rdoUMW.Name = "rdoUMW";
            this.rdoUMW.UseVisualStyleBackColor = true;
            // 
            // rdoIIS
            // 
            resources.ApplyResources(this.rdoIIS, "rdoIIS");
            this.rdoIIS.Checked = true;
            this.rdoIIS.Name = "rdoIIS";
            this.rdoIIS.TabStop = true;
            this.rdoIIS.UseVisualStyleBackColor = true;
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
            // 
            // lblServer
            // 
            resources.ApplyResources(this.lblServer, "lblServer");
            this.lblServer.Name = "lblServer";
            // 
            // textBox3
            // 
            resources.ApplyResources(this.textBox3, "textBox3");
            this.textBox3.Name = "textBox3";
            // 
            // btnTest
            // 
            resources.ApplyResources(this.btnTest, "btnTest");
            this.btnTest.Name = "btnTest";
            this.btnTest.UseVisualStyleBackColor = true;
            // 
            // lblDomain
            // 
            resources.ApplyResources(this.lblDomain, "lblDomain");
            this.lblDomain.Name = "lblDomain";
            // 
            // textBox1
            // 
            resources.ApplyResources(this.textBox1, "textBox1");
            this.textBox1.Name = "textBox1";
            // 
            // button1
            // 
            resources.ApplyResources(this.button1, "button1");
            this.button1.Name = "button1";
            this.button1.UseVisualStyleBackColor = true;
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
            // 
            // rdoSQL
            // 
            resources.ApplyResources(this.rdoSQL, "rdoSQL");
            this.rdoSQL.Name = "rdoSQL";
            this.rdoSQL.TabStop = true;
            this.rdoSQL.UseVisualStyleBackColor = true;
            // 
            // rdoDomain
            // 
            resources.ApplyResources(this.rdoDomain, "rdoDomain");
            this.rdoDomain.Name = "rdoDomain";
            this.rdoDomain.TabStop = true;
            this.rdoDomain.UseVisualStyleBackColor = true;
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
            // btnFolderBrowser
            // 
            resources.ApplyResources(this.btnFolderBrowser, "btnFolderBrowser");
            this.btnFolderBrowser.Name = "btnFolderBrowser";
            this.btnFolderBrowser.UseVisualStyleBackColor = true;
            this.btnFolderBrowser.Click += new System.EventHandler(this.btnFolderBrowser_Click);
            // 
            // btnAddEx
            // 
            resources.ApplyResources(this.btnAddEx, "btnAddEx");
            this.btnAddEx.Name = "btnAddEx";
            this.btnAddEx.UseVisualStyleBackColor = true;
            this.btnAddEx.Click += new System.EventHandler(this.btnAddEx_Click);
            // 
            // btnRemoveEx
            // 
            resources.ApplyResources(this.btnRemoveEx, "btnRemoveEx");
            this.btnRemoveEx.Name = "btnRemoveEx";
            this.btnRemoveEx.UseVisualStyleBackColor = true;
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
        private System.Windows.Forms.Label lblvRoot;
        private System.Windows.Forms.TextBox txtvRoot;
        private System.Windows.Forms.RadioButton rdoUMW;
        private System.Windows.Forms.RadioButton rdoIIS;
        private System.Windows.Forms.TabPage tabPage2;
        private System.Windows.Forms.Label lblDBName;
        private System.Windows.Forms.TextBox txtDBName;
        private System.Windows.Forms.Label lblServer;
        private System.Windows.Forms.TextBox textBox3;
        private System.Windows.Forms.Button btnTest;
        private System.Windows.Forms.Label lblDomain;
        private System.Windows.Forms.TextBox textBox1;
        private System.Windows.Forms.Button button1;
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
    }
}

