<%@ Page Title="Home Page" Language="C#" MasterPageFile="~/Site.Master" AutoEventWireup="true" CodeBehind="Default.aspx.cs" Inherits="WebApplication1._Default" %>

<%@ Register Assembly="Microsoft.ReportViewer.WebForms, Version=11.0.0.0, Culture=neutral, PublicKeyToken=89845dcd8080cc91" Namespace="Microsoft.Reporting.WebForms" TagPrefix="rsweb" %>

<asp:Content runat="server" ID="BodyContent" ContentPlaceHolderID="MainContent">
    <rsweb:ReportViewer ID="ReportViewer1" runat="server"></rsweb:ReportViewer>
   </asp:Content>