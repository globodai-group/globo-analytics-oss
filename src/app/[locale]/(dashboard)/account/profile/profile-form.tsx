"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, User } from "lucide-react";
import { updateProfileAction } from "@/lib/actions/account";

const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  email: z.string().email("Invalid email address"),
});

type ProfileInput = z.infer<typeof profileSchema>;

interface ProfileFormProps {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    image: string | null;
  };
  locale: string;
}

export function ProfileForm({ user, locale }: ProfileFormProps) {
  const t = useTranslations("account.profile");
  const tCommon = useTranslations("common");
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    },
  });

  async function onSubmit(data: ProfileInput) {
    setIsLoading(true);
    try {
      const result = await updateProfileAction(data, locale);
      if (result.success) {
        toast.success(t("updated"));
      } else {
        toast.error(result.error || "Failed to update profile");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setIsLoading(false);
    }
  }

  const initials =
    `${user.firstName[0] || ""}${user.lastName[0] || ""}`.toUpperCase();
  const fullName = `${user.firstName} ${user.lastName}`;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Avatar */}
      <div className="flex items-center gap-4">
        <Avatar className="h-20 w-20">
          <AvatarImage src={user.image || undefined} alt={fullName} />
          <AvatarFallback className="text-lg">
            {initials || <User className="h-8 w-8" />}
          </AvatarFallback>
        </Avatar>
        <div>
          <Button type="button" variant="outline" size="sm" disabled>
            {t("changeAvatar")}
          </Button>
          <p className="text-xs text-muted-foreground mt-1">
            {locale === "fr" ? "Bientôt disponible" : "Coming soon"}
          </p>
        </div>
      </div>

      {/* First Name & Last Name */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">{t("firstName")}</Label>
          <Input
            id="firstName"
            {...register("firstName")}
            disabled={isLoading}
          />
          {errors.firstName && (
            <p className="text-sm text-destructive">
              {errors.firstName.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">{t("lastName")}</Label>
          <Input id="lastName" {...register("lastName")} disabled={isLoading} />
          {errors.lastName && (
            <p className="text-sm text-destructive">
              {errors.lastName.message}
            </p>
          )}
        </div>
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email">{tCommon("email")}</Label>
        <Input
          id="email"
          type="email"
          {...register("email")}
          disabled={isLoading}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          {locale === "fr"
            ? "La modification de l'email nécessitera une vérification."
            : "Changing your email will require verification."}
        </p>
      </div>

      {/* Submit */}
      <Button type="submit" disabled={isLoading}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {tCommon("save")}
      </Button>
    </form>
  );
}
