import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isAppRole, roleLabelNb } from "@/lib/user-profile";
import { InviteRegistrationForm } from "./InviteRegistrationForm";

interface InvitePageProps {
  params: Promise<{ token: string }>;
}

const InvitePage = async ({ params }: InvitePageProps) => {
  const { token } = await params;
  const supabase = createSupabaseAdminClient();

  const { data: invite } = await supabase
    .from("invites")
    .select("id, email, role, expires_at, accepted_at")
    .eq("token", token)
    .single();

  if (!invite) {
    return (
      <>
        <h1 className="gjest-auth-heading">Ugyldig invitasjon</h1>
        <p className="gjest-auth-subheading">
          Denne invitasjonslenken er ugyldig eller finnes ikke.
        </p>
      </>
    );
  }

  if (invite.accepted_at) {
    return (
      <>
        <h1 className="gjest-auth-heading">Allerede brukt</h1>
        <p className="gjest-auth-subheading">
          Denne invitasjonen er allerede brukt. Logg inn i stedet.
        </p>
        <a href="/auth/login" className="gjest-auth-btn mt-4 block text-center">
          Logg inn
        </a>
      </>
    );
  }

  if (new Date(invite.expires_at) < new Date()) {
    return (
      <>
        <h1 className="gjest-auth-heading">Utløpt invitasjon</h1>
        <p className="gjest-auth-subheading">
          Denne invitasjonen har utløpt. Be om en ny invitasjon fra
          administrasjonen.
        </p>
      </>
    );
  }

  const inviteRole = isAppRole(invite.role) ? invite.role : "employee";

  return (
    <>
      <h1 className="gjest-auth-heading">Registrering</h1>
      <p className="gjest-auth-subheading">
        Du er invitert som{" "}
        <strong>{roleLabelNb[inviteRole]}</strong>
        . Tittel og visningsnavn kan du sette under profil etter innlogging.
      </p>
      <InviteRegistrationForm
        token={token}
        email={invite.email}
        inviteRole={inviteRole}
      />
    </>
  );
};

export default InvitePage;
