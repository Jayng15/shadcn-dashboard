
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import api from "@/lib/api";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";

const formSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export default function LoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    try {
        // The backend expects json content directly based on auth.route.ts
      const response = await api.post("/auth/login", values);

      const { user } = response.data; // Assuming token is set in cookie or returned.
      // Checking auth.route.ts, it returns user object.
      // If session is cookie-based, we don't need to save token manually.
      // IF JWT based, we need to save it. Does backend use cookies or Bearer token?
      // Based on typical Hono/Lucia setup it might be cookies.
      // BUT my plan assumed localStorage.
      // Let's check if the response has a token or if it's cookie based.
      // Backend route /auth/login returns { success: boolean, user: {id, email} }
      // It does NOT seem to return a token explicitly in the body based on the route definition I saw earlier.
      // It likely sets a session cookie.
      // IF it is cookie based, axios withCredentials: true is needed usually.

      // WAIT, the `api.ts` I created uses localStorage 'token'.
      // If the backend is cookie-only, that won't work.
      // However, usually API returns a token if it's for mobile/SPA unless strictly same-site.
      // Looking at `auth.route.ts`:
      /*
        74:         200: {
        75:             description: 'Login successful',
        76:             content: {
        77:                 'application/json': {
        78:                     schema: z.object({
        79:                         success: z.boolean(),
        80:                         user: z.object({ ... })
        81:                     })
        82:                 }
        83:             }
        84:         },
      */
      // No token in response body. This suggests strictly HttpOnly cookies via Lucia.

      // I will assume for now we just rely on the cookie and set a "loggedIn" flag in localStorage for UI state.
      // AND I need to insure `api.ts` sends credentials.

      localStorage.setItem("isAuthenticated", "true");
      // Store user info if needed
      localStorage.setItem("user", JSON.stringify(user));

      toast.success("Login successful");
      navigate({ to: "/" });
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="mx-auto max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">Login</CardTitle>
        <CardDescription>
          Enter your email below to login to your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="admin@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
