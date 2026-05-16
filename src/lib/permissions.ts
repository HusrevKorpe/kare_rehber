import type { Rol } from "@/generated/prisma/enums";

export const ROLLER = {
  ADMIN: "ADMIN",
  KOORDINATOR: "KOORDINATOR",
  KOC: "KOC",
  OGRENCI: "OGRENCI",
  VELI: "VELI",
} as const satisfies Record<Rol, Rol>;

export const ROL_ETIKETLERI: Record<Rol, string> = {
  ADMIN: "Yönetici",
  KOORDINATOR: "Koordinatör",
  KOC: "Koç",
  OGRENCI: "Öğrenci",
  VELI: "Veli",
};

export const ROL_PANELLERI: Record<Rol, string> = {
  ADMIN: "/admin",
  KOORDINATOR: "/koordinator",
  KOC: "/koc",
  OGRENCI: "/ogrenci",
  VELI: "/veli",
};

export function canApproveGorusme(rol: Rol) {
  return rol === "ADMIN";
}

export function canViewGorusmeWithoutApproval(rol: Rol) {
  // Admin tüm görüşmeleri görür; vakıf koordinatörü onaysız da görür; koç kendi yazdığını görür.
  return rol === "ADMIN" || rol === "KOORDINATOR" || rol === "KOC";
}

export function canSendSms(rol: Rol) {
  return rol === "ADMIN";
}

export function canManageUsers(rol: Rol) {
  return rol === "ADMIN";
}
