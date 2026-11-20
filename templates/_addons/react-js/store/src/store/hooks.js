// Use these app-level hooks instead of importing from react-redux directly
// (keeps call sites identical to the TypeScript template).
import { useDispatch, useSelector } from "react-redux";

export const useAppDispatch = useDispatch;
export const useAppSelector = useSelector;
