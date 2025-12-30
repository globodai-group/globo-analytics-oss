"use server";

import { prisma } from "@/lib/prisma";
import { hashPassword, signIn, signOut } from "@/lib/auth";
import { registerSchema, forgotPasswordSchema, resetPasswordSchema } from "@/lib/validations/auth";
import { redirect } from "next/navigation";
import {
  sendEmail,
  getVerifyEmailTemplate,
  getResetPasswordTemplate,
  getTfaCodeTemplate,
  getVerifyEmailUrl,
  getResetPasswordUrl,
  generateToken,
  generateTfaCode,
} from "@/lib/email";
import { checkRateLimitOrError } from "@/lib/security/rate-limit";

export async function registerAction(formData: FormData, locale: string = "en") {
  const rawData = {
    firstName: formData.get("firstName") as string,
    lastName: formData.get("lastName") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    confirmPassword: formData.get("confirmPassword") as string,
    acceptTerms: formData.get("acceptTerms") === "on",
  };

  const validatedFields = registerSchema.safeParse(rawData);

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.issues[0].message,
    };
  }

  const { firstName, lastName, email, password } = validatedFields.data;

  // Vérifier si l'email existe déjà
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return {
      error:
        locale === "fr"
          ? "Un compte avec cet email existe déjà"
          : "An account with this email already exists",
    };
  }

  // Créer l'utilisateur
  const hashedPassword = await hashPassword(password);
  const verifyToken = generateToken();
  const verifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 heures

  try {
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        role: "USER",
        locale: locale,
        timezone: "Europe/Paris",
        emailVerifyToken: verifyToken,
        emailVerifyExpires: verifyExpires,
      },
    });

    // Envoyer l'email de vérification
    const verifyUrl = getVerifyEmailUrl(verifyToken, locale);
    const emailHtml = getVerifyEmailTemplate(firstName, verifyUrl, locale);

    await sendEmail({
      to: email,
      subject: locale === "fr" ? "Vérifiez votre adresse email" : "Verify your email address",
      html: emailHtml,
    });

    return {
      success: true,
      userId: user.id,
      message:
        locale === "fr"
          ? "Compte créé ! Vérifiez votre email pour activer votre compte."
          : "Account created! Check your email to activate your account.",
      requiresVerification: true,
    };
  } catch (error) {
    console.error("Erreur lors de l'inscription:", error);
    return {
      error:
        locale === "fr"
          ? "Une erreur est survenue lors de l'inscription"
          : "An error occurred during registration",
    };
  }
}

export async function loginAction(formData: FormData, locale: string = "en") {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  // SECURITY: Rate limit by email to prevent brute-force attacks
  const rateLimitError = await checkRateLimitOrError("LOGIN", email.toLowerCase(), locale);
  if (rateLimitError) {
    return { error: rateLimitError };
  }

  try {
    // Vérifier si l'utilisateur existe et a un 2FA activé
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        tfaEnabled: true,
        tfaDefaultMethod: true,
        totpVerified: true,
        emailVerified: true,
        firstName: true,
        locale: true,
        _count: {
          select: {
            passkeys: true,
          },
        },
      },
    });

    if (!user) {
      return {
        error: locale === "fr" ? "Email ou mot de passe incorrect" : "Invalid email or password",
      };
    }

    // Vérifier si l'email est vérifié
    if (!user.emailVerified) {
      return {
        error:
          locale === "fr"
            ? "Veuillez vérifier votre email avant de vous connecter"
            : "Please verify your email before signing in",
        requiresVerification: true,
        email: email,
      };
    }

    // Si 2FA est activé
    if (user.tfaEnabled) {
      const hasTotp = user.totpVerified;
      const hasPasskey = user._count.passkeys > 0;

      // Déterminer la méthode par défaut
      let defaultMethod = user.tfaDefaultMethod || "email";

      // Si la méthode par défaut n'est pas disponible, choisir une alternative
      if (defaultMethod === "totp" && !hasTotp) {
        defaultMethod = hasPasskey ? "passkey" : "email";
      } else if (defaultMethod === "passkey" && !hasPasskey) {
        defaultMethod = hasTotp ? "totp" : "email";
      }

      // Si la méthode par défaut est email ou si aucune autre méthode n'est disponible
      if (defaultMethod === "email" || (!hasTotp && !hasPasskey)) {
        const tfaCode = generateTfaCode();
        const tfaExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        await prisma.user.update({
          where: { id: user.id },
          data: {
            tfaCode,
            tfaCodeCreatedAt: tfaExpires,
          },
        });

        // Envoyer le code par email
        const emailHtml = getTfaCodeTemplate(user.firstName, tfaCode, user.locale || locale);

        await sendEmail({
          to: email,
          subject: locale === "fr" ? "Votre code de vérification" : "Your verification code",
          html: emailHtml,
        });
      }

      return {
        success: true,
        requires2FA: true,
        userId: user.id,
        hasTotp,
        hasPasskey,
        defaultMethod,
      };
    }

    // Connexion sans 2FA
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    return { success: true };
  } catch {
    return {
      error: locale === "fr" ? "Email ou mot de passe incorrect" : "Invalid email or password",
    };
  }
}

export async function logoutAction() {
  await signOut({ redirect: false });
  redirect("/login");
}

export async function forgotPasswordAction(formData: FormData, locale: string = "en") {
  const rawData = {
    email: formData.get("email") as string,
  };

  const validatedFields = forgotPasswordSchema.safeParse(rawData);

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.issues[0].message,
    };
  }

  const { email } = validatedFields.data;

  // SECURITY: Rate limit by email to prevent abuse
  const rateLimitError = await checkRateLimitOrError("PASSWORD_RESET", email.toLowerCase(), locale);
  if (rateLimitError) {
    return { error: rateLimitError };
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, firstName: true, locale: true },
  });

  // Ne pas révéler si l'email existe ou non
  const successMessage =
    locale === "fr"
      ? "Si un compte existe avec cet email, vous recevrez un lien de réinitialisation"
      : "If an account exists with this email, you will receive a reset link";

  if (!user) {
    return {
      success: true,
      message: successMessage,
    };
  }

  // Générer un token de réinitialisation
  const token = generateToken();
  const expires = new Date(Date.now() + 3600000); // 1 heure

  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetToken: token,
      resetTokenExpires: expires,
    },
  });

  // Envoyer l'email
  const resetUrl = getResetPasswordUrl(token, user.locale || locale);
  const emailHtml = getResetPasswordTemplate(user.firstName, resetUrl, user.locale || locale);

  await sendEmail({
    to: email,
    subject: locale === "fr" ? "Réinitialisez votre mot de passe" : "Reset your password",
    html: emailHtml,
  });

  return {
    success: true,
    message: successMessage,
  };
}

export async function resetPasswordAction(formData: FormData, locale: string = "en") {
  const rawData = {
    token: formData.get("token") as string,
    password: formData.get("password") as string,
    confirmPassword: formData.get("confirmPassword") as string,
  };

  const validatedFields = resetPasswordSchema.safeParse(rawData);

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.issues[0].message,
    };
  }

  const { token, password } = validatedFields.data;

  const user = await prisma.user.findFirst({
    where: {
      resetToken: token,
      resetTokenExpires: {
        gt: new Date(),
      },
    },
  });

  if (!user) {
    return {
      error:
        locale === "fr"
          ? "Le lien de réinitialisation est invalide ou expiré"
          : "The reset link is invalid or expired",
    };
  }

  const hashedPassword = await hashPassword(password);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      resetToken: null,
      resetTokenExpires: null,
    },
  });

  return {
    success: true,
    message:
      locale === "fr"
        ? "Votre mot de passe a été réinitialisé avec succès"
        : "Your password has been reset successfully",
  };
}

export async function verifyEmailAction(token: string, locale: string = "en") {
  const user = await prisma.user.findFirst({
    where: {
      emailVerifyToken: token,
      emailVerifyExpires: {
        gt: new Date(),
      },
    },
  });

  if (!user) {
    return {
      error:
        locale === "fr"
          ? "Le lien de vérification est invalide ou expiré"
          : "The verification link is invalid or expired",
    };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: new Date(),
      emailVerifyToken: null,
      emailVerifyExpires: null,
    },
  });

  return {
    success: true,
    message:
      locale === "fr"
        ? "Votre email a été vérifié avec succès"
        : "Your email has been verified successfully",
  };
}

export async function resendVerificationEmailAction(email: string, locale: string = "en") {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, firstName: true, emailVerified: true },
  });

  if (!user) {
    return {
      error:
        locale === "fr" ? "Aucun compte trouvé avec cet email" : "No account found with this email",
    };
  }

  if (user.emailVerified) {
    return {
      error: locale === "fr" ? "Cet email est déjà vérifié" : "This email is already verified",
    };
  }

  const verifyToken = generateToken();
  const verifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 heures

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerifyToken: verifyToken,
      emailVerifyExpires: verifyExpires,
    },
  });

  const verifyUrl = getVerifyEmailUrl(verifyToken, locale);
  const emailHtml = getVerifyEmailTemplate(user.firstName, verifyUrl, locale);

  await sendEmail({
    to: email,
    subject: locale === "fr" ? "Vérifiez votre adresse email" : "Verify your email address",
    html: emailHtml,
  });

  return {
    success: true,
    message: locale === "fr" ? "Email de vérification envoyé" : "Verification email sent",
  };
}

export async function sendTfaCodeAction(userId: string, locale: string = "en") {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, firstName: true, email: true, locale: true },
  });

  if (!user) {
    return {
      error: locale === "fr" ? "Utilisateur non trouvé" : "User not found",
    };
  }

  const tfaCode = generateTfaCode();
  const tfaExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await prisma.user.update({
    where: { id: user.id },
    data: {
      tfaCode,
      tfaCodeCreatedAt: tfaExpires,
    },
  });

  const emailHtml = getTfaCodeTemplate(user.firstName, tfaCode, user.locale || locale);

  await sendEmail({
    to: user.email,
    subject: locale === "fr" ? "Votre code de vérification" : "Your verification code",
    html: emailHtml,
  });

  return {
    success: true,
    message: locale === "fr" ? "Code envoyé avec succès" : "Code sent successfully",
  };
}

export async function verifyTfaAction(formData: FormData, locale: string = "en") {
  const code = formData.get("code") as string;
  const userId = formData.get("userId") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!userId || !code) {
    return {
      error: locale === "fr" ? "Données manquantes" : "Missing data",
    };
  }

  // SECURITY: Rate limit by userId to prevent brute-force
  const rateLimitError = await checkRateLimitOrError("TFA_VERIFY", userId, locale);
  if (rateLimitError) {
    return { error: rateLimitError };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      tfaCode: true,
      tfaCodeCreatedAt: true,
    },
  });

  if (!user) {
    return {
      error: locale === "fr" ? "Utilisateur non trouvé" : "User not found",
    };
  }

  // Vérifier si le code est expiré
  if (!user.tfaCodeCreatedAt || new Date() > user.tfaCodeCreatedAt) {
    return {
      error: locale === "fr" ? "Le code a expiré" : "The code has expired",
    };
  }

  // Vérifier le code
  if (user.tfaCode !== code) {
    return {
      error: locale === "fr" ? "Code de vérification invalide" : "Invalid verification code",
    };
  }

  // Effacer le code utilisé
  await prisma.user.update({
    where: { id: user.id },
    data: {
      tfaCode: null,
      tfaCodeCreatedAt: null,
    },
  });

  // Connecter l'utilisateur
  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    return { success: true };
  } catch {
    return {
      error: locale === "fr" ? "Erreur lors de la connexion" : "Error signing in",
    };
  }
}
