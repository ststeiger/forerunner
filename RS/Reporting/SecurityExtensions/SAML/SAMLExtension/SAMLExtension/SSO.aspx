<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="SSO.aspx.cs" Inherits="ForeRunner.Reporting.Extensions.SAML.SSO" EnableSessionState="True" EnableViewStateMac="false"%>

<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">

<html xmlns="http://www.w3.org/1999/xhtml" >
<head runat="server">
    <title></title>
</head>
<body runat="server" id="bodySSO">
    <form id="frmSSO" runat="server" enableviewstate="False">
    <center><asp:Label ID="lblMessage" runat="server" 
        Text="Redirecting to external site..." EnableViewState="False"></asp:Label>
        <br />
    </center>
    <div style="display:none" >
        <input id="SAMLResponse" type="text" runat="server" enableviewstate="False"/>
        <input id="RelayState" type="text" runat="server" enableviewstate="False"/>
    </div>
    </form>
</body>
</html>
