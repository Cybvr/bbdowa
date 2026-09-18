import type { User as FirebaseUser } from "firebase/auth";

export type SessionUser = {
  uid: string;
  name: string | null;
  email: string | null;
  picture: string | null;
};

export function sessionUserFromFirebaseUser(user: FirebaseUser): SessionUser {
  return {
    uid: user.uid,
    name: user.displayName,
    email: user.email,
    picture: user.photoURL,
  };
}
