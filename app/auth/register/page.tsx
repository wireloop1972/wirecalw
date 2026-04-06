import Link from "next/link";

const RegisterPage = () => (
  <>
    <h1 className="gjest-auth-heading">Registrering</h1>
    <p className="gjest-auth-subheading">
      Kun inviterte brukere kan registrere seg.
      <br />
      Ta kontakt med administrasjonen for tilgang.
    </p>
    <Link
      href="/auth/login"
      className="gjest-auth-btn mt-4 inline-block text-center"
    >
      Tilbake til innlogging
    </Link>
  </>
);

export default RegisterPage;
