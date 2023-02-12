# Contributing to CVE Services

Thank you for considering contributions to the CVE Project's Automation Working Group!

The following is a set of guidelines for contributing. In general, use your best judgement, and feel free to propose changes to this document in a pull request.

#### Table Of Contents

[Code of Conduct](#code-of-conduct)

[I just have a question!!!](#i-just-have-a-question)

[What should I know before I get started?](#what-should-i-know-before-i-get-started)

[How Can I Contribute?](#how-can-i-contribute)

  * [Reporting Bugs](#reporting-bugs)
  * [Pull Requests](#pull-requests)

[Style Guides](#style-guides)

  * [Git Commit Messages](#git-commit-messages)
  * [JavaScript Style Guide](#javascript-style-guide)

[Additional Notes](#additional-notes)
  * [Issue and Pull Request Labels](#issue-and-pull-request-labels)

## Code of Conduct

Contributors to this project are governed by the [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior via email to the AWG Chair at rbritton@mitre.org.

## I just have a question

>**Note:**
>Please don't file an issue to ask a question. Chat is the fastest way to get an answer.

Join the CVE Services Slack channel - email the AWG Chair, rbritton@mitre.org.

## How Can I Contribute?

### Reporting Bugs

This section guides you through submitting a bug report. Following these guidelines helps maintainers and the community understand your report, reproduce the behavior, and find related reports.

Before creating bug reports, please check [this list](#before-submitting-a-bug-report) as you might find out that you don't need to create one. When you are creating a bug report, please [include as many details as possible](#how-do-i-submit-a-good-bug-report). Fill out [the required template](https://github.com/CVEProject/cve-services/blob/dev/.github/ISSUE_TEMPLATE/bug_report.md), the information it asks for helps us resolve issues faster.

>**Note:**
> If you find a **Closed** issue that seems like it is the same thing that you're experiencing, open a new issue and include a link to the original issue in the body of your new one.

#### Before Submitting A Bug Report

<!-- * **Check the [FAQs on the forum](todo)** for a list of common questions and problems. -->
**Perform a [cursory search](https://github.com/CVEProject/cve-services/issues?q=is%3Aopen+is%3Aissue+label%3Abug)** to see if the problem has already been reported. If it has **and the issue is still open**, add a comment to the existing issue instead of opening a new one.

#### How Do I Submit A (Good) Bug Report?

Bugs are tracked as [GitHub issues](https://guides.github.com/features/issues/). Provide the following information by filling in [the template](https://github.com/CVEProject/cve-services/blob/dev/.github/ISSUE_TEMPLATE/bug_report.md).

Explain the problem and include additional details to help maintainers reproduce the problem:

* **Use a clear and descriptive title** for the issue to identify the problem.
* **Describe the exact steps which reproduce the problem** in as many details as possible. For example, start by explaining how you started Atom, e.g. which command exactly you used in the terminal, or how you started Atom otherwise. When listing steps, **don't just say what you did, but explain how you did it**. For example, if you moved the cursor to the end of a line, explain if you used the mouse, or a keyboard shortcut or an Atom command, and if so which one?
* **Provide specific examples to demonstrate the steps**. Include links to files or GitHub projects, or copy/pasteable snippets, which you use in those examples. If you're providing snippets in the issue, use [Markdown code blocks](https://help.github.com/articles/markdown-basics/#multiple-lines).
* **Describe the behavior you observed after following the steps** and point out what exactly is the problem with that behavior.
* **Explain which behavior you expected to see instead and why.**
* **If the problem wasn't triggered by a specific action**, describe what you were doing before the problem happened and share more information using the guidelines below.

Provide more context by answering these questions:

* **Can you reliably reproduce the issue?** If not, provide details about how often the problem happens and under which conditions it normally happens.

Include details about your configuration and environment:

* **Which version of the API are you using?**
* **What's the name and version of the OS you're using**?

### Code Proposals
This section guides you through submitting a code proposal for CVE services, including completely new features and minor improvements to existing functionality. Following these guidelines helps maintainers and the community understand your proposal and find related suggestions.

Before creating a code proposal, please check [this list](https://github.com/CVEProject/cve-services/issues?q=is%3Aopen+is%3Aissue+label%3A%22code+proposal%22) as you might find out that you don't need to create one. When you are creating a code proposal, please fill in [the template](https://github.com/CVEProject/cve-services/blob/dev/.github/ISSUE_TEMPLATE/feature_request.md), including the steps that you imagine you would take if the feature you're requesting existed.

#### How Do I Submit A (Good) Code Proposal?

Enhancement suggestions are tracked as [GitHub issues](https://guides.github.com/features/issues/). Please make sure to provide the following information:

* **Use a clear and descriptive title** for the issue to identify the suggestion.
* **Provide a step-by-step description of the suggested enhancement** in as many details as possible.
* **Provide specific examples to demonstrate the steps when applicable**. Include copy/paste-able snippets which you use in those examples, as [Markdown code blocks](https://help.github.com/articles/markdown-basics/#multiple-lines).
* **Describe the current behavior** and **explain which behavior you expected to see instead** and why (if applicable).
* **Explain why this enhancement would be useful** to most users and isn't something that can or should be implemented as an outside service that just integrates with the API.

### Pull Requests

The process described here has several goals:

- Maintain quality
- Fix problems that are important to users
- Engage the community in working toward the best possible solutions
- Enable a sustainable system for maintainers to review contributions

Please follow these steps to have your contribution considered by the maintainers:

1. Follow the instructions in [the template](PULL_REQUEST_TEMPLATE.md)
2. Follow the [style guides](#style-guides)
3. After you submit a pull request, verify that all [status checks](https://help.github.com/articles/about-status-checks/) pass <details><summary>What if the status checks fail?</summary>If a status check fails and you believe that the failure is unrelated to your change, please leave a comment explaining why. If the failure was a false positive, a reviewer will open an issue to track that problem with the status check suite.</details>

>**Note**
> A reviewer may ask you to complete additional design work, tests, or other changes before your pull request is accepted.

## Style Guides

### Git Commit Messages

* Begin the message with the issue number, for example: "#123 this is the commit message". (Git CLI users should specify the message as a flag: `git commit -m "#123 message"` or change the [core.commentchar](https://git-scm.com/docs/git-config#Documentation/git-config.txt-corecommentChar) value.)
* Use the present tense ("Add feature" not "Added feature")
* Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
* Limit the first line to 72 characters or less

### JavaScript Style Guide

All JavaScript must adhere to [JavaScript Standard Style](https://standardjs.com/).