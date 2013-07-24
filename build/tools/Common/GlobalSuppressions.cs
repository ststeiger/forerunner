//-----------------------------------------------------------------------
// <copyright file="GlobalSuppressions.cs" company="Jon Rowlett">
//     Copyright (C) 2010 Jon Rowlett. All rights reserved.
// </copyright>
// <author>Jon Rowlett</author>
//-----------------------------------------------------------------------
using System.Diagnostics.CodeAnalysis;

[module: SuppressMessage("Microsoft.Design", "CA1020:AvoidNamespacesWithFewTypes", Scope = "namespace", Target = "Common.Diagnostics")]
[module: SuppressMessage("Microsoft.Design", "CA1020:AvoidNamespacesWithFewTypes", Scope = "namespace", Target = "Common.Text")]
[module: SuppressMessage("Microsoft.Design", "CA1020:AvoidNamespacesWithFewTypes", Scope = "namespace", Target = "Common")]

[module: SuppressMessage("Microsoft.Design", "CA1011:ConsiderPassingBaseTypesAsParameters", Scope = "member", Target = "Common.Diagnostics.TraceUtility.#TraceMethod(System.Diagnostics.TraceSource,System.Type,System.String)")]

[module: SuppressMessage("Microsoft.Usage", "CA2233:OperationsShouldNotOverflow", Scope = "member", Target = "Common.Text.HexDecoder.#GetCharCount(System.Byte[],System.Int32,System.Int32)", MessageId = "count*2")]
[module: SuppressMessage("Microsoft.Usage", "CA2233:OperationsShouldNotOverflow", Scope = "member", Target = "Common.Text.HexDecoder.#GetChars(System.Byte[],System.Int32,System.Int32,System.Char[],System.Int32)", MessageId = "byteCount*2")]

[module: SuppressMessage("Microsoft.Design", "CA1000:DoNotDeclareStaticMembersOnGenericTypes", Scope = "member", Target = "Common.ArrayEqualityComparer`1.#Default")]