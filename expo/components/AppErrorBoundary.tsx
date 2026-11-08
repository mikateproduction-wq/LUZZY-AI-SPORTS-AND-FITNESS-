import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

import { useTheme } from "@/contexts/ThemeContext";
import { logger } from "@/utils/logger";

type Props = {
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
  errorMessage: string | null;
};

class ErrorBoundaryImpl extends React.Component<
  Props & { theme: ReturnType<typeof useTheme>["theme"] },
  State
> {
  state: State = { hasError: false, errorMessage: null };

  static getDerivedStateFromError(): State {
    return { hasError: true, errorMessage: "Une erreur inattendue s'est produite." };
  }

  componentDidCatch(error: unknown) {
    logger.error("[ErrorBoundary] caught error", error);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, errorMessage: null });
  };

  render() {
    if (this.state.hasError) {
      const { theme } = this.props;
      return (
        <View
          style={[styles.container, { backgroundColor: theme.colors.background }]}
          testID="errorBoundary.container"
        >
          <View style={[styles.card, { backgroundColor: theme.colors.surface }]}> 
            <Text style={[styles.title, { color: theme.colors.text }]}>Oups</Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              {this.state.errorMessage ?? "Une erreur inattendue s'est produite."}
            </Text>
            <TouchableOpacity
              onPress={this.handleRetry}
              style={[styles.button, { backgroundColor: theme.colors.primary }]}
              testID="errorBoundary.retry"
            >
              <Text style={styles.buttonText}>Réessayer</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

function ErrorBoundaryWithTheme(props: Props) {
  const { theme } = useTheme();
  return <ErrorBoundaryImpl {...props} theme={theme} />;
}

export const AppErrorBoundary = React.memo(ErrorBoundaryWithTheme);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    borderRadius: 18,
    padding: 18,
  },
  title: {
    fontSize: 22,
    fontWeight: "800" as const,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
  },
  button: {
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "700" as const,
    fontSize: 15,
  },
});
