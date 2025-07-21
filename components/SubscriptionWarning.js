import { useState, useEffect } from 'react';
import { useAuth } from '@/utils/AuthContext';
import Icon from '@/components/FontAwesome';
import Link from 'next/link';

export default function SubscriptionWarning() {
  const { user } = useAuth();
  const [warnings, setWarnings] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(new Set());

  useEffect(() => {
    if (user && user.role === 'company') {
      fetchSubscriptionStatus();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchSubscriptionStatus = async () => {
    try {
      const [warningsResponse, suggestionsResponse] = await Promise.all([
        fetch('/api/subscription/warnings', {
          credentials: 'include'
        }),
        fetch('/api/subscription/suggestions', {
          credentials: 'include'
        })
      ]);

      if (warningsResponse.ok) {
        const warningsData = await warningsResponse.json();
        setWarnings(warningsData.warnings || []);
      }

      if (suggestionsResponse.ok) {
        const suggestionsData = await suggestionsResponse.json();
        setSuggestions(suggestionsData.suggestions || []);
      }
    } catch (error) {
      console.error('Error fetching subscription status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = (warningId) => {
    setDismissed(prev => new Set([...prev, warningId]));
  };

  const getWarningIcon = (severity) => {
    switch (severity) {
      case 'critical':
        return ['fas', 'exclamation-triangle'];
      case 'warning':
        return ['fas', 'exclamation-circle'];
      default:
        return ['fas', 'info-circle'];
    }
  };

  const getWarningColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'critical';
      case 'warning':
        return 'warning';
      default:
        return 'info';
    }
  };

  const getSuggestionIcon = (urgency) => {
    switch (urgency) {
      case 'critical':
        return ['fas', 'arrow-up'];
      case 'recommended':
        return ['fas', 'star'];
      default:
        return ['fas', 'lightbulb'];
    }
  };

  const getSuggestionColor = (urgency) => {
    switch (urgency) {
      case 'critical':
        return 'critical';
      case 'recommended':
        return 'recommended';
      default:
        return 'optional';
    }
  };

  if (loading || !user || user.role !== 'company') {
    return null;
  }

  const visibleWarnings = warnings.filter(warning => !dismissed.has(warning.type));
  const criticalSuggestions = suggestions.filter(suggestion => suggestion.urgency === 'critical');

  if (visibleWarnings.length === 0 && criticalSuggestions.length === 0) {
    return null;
  }

  return (
    <div className="subscription-warning-container">
      {/* Critical Warnings */}
      {visibleWarnings.map((warning, index) => (
        <div key={warning.type} className={`subscription-warning ${getWarningColor(warning.severity)}`}>
          <div className="subscription-warning-content">
            <div className="subscription-warning-icon">
              <Icon icon={getWarningIcon(warning.severity)} />
            </div>
            <div className="subscription-warning-message">
              <strong>{warning.severity === 'critical' ? 'Action Required' : 'Warning'}</strong>
              <p>{warning.message}</p>
            </div>
            <div className="subscription-warning-actions">
              {warning.type === 'subscription_expiry' && (
                <Link href="/subscription/upgrade">
                  <button className="subscription-btn subscription-btn-primary">
                    Renew Now
                  </button>
                </Link>
              )}
              {(warning.type === 'package_limit' || warning.type === 'booking_limit') && (
                <Link href="/subscription/upgrade">
                  <button className="subscription-btn subscription-btn-primary">
                    Upgrade Plan
                  </button>
                </Link>
              )}
              <button 
                className="subscription-btn subscription-btn-secondary"
                onClick={() => handleDismiss(warning.type)}
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* Critical Suggestions */}
      {criticalSuggestions.map((suggestion, index) => (
        <div key={index} className={`subscription-suggestion ${getSuggestionColor(suggestion.urgency)}`}>
          <div className="subscription-suggestion-content">
            <div className="subscription-suggestion-icon">
              <Icon icon={getSuggestionIcon(suggestion.urgency)} />
            </div>
            <div className="subscription-suggestion-message">
              <strong>Upgrade Recommended</strong>
              <p>{suggestion.suggestion}</p>
              <small>Reason: {suggestion.reason}</small>
            </div>
            <div className="subscription-suggestion-actions">
              <Link href="/subscription/upgrade">
                <button className="subscription-btn subscription-btn-primary">
                  View Plans
                </button>
              </Link>
            </div>
          </div>
        </div>
      ))}

      <style jsx>{`
        .subscription-warning-container {
          position: fixed;
          top: 80px;
          right: 20px;
          z-index: 1000;
          max-width: 400px;
        }

        .subscription-warning,
        .subscription-suggestion {
          margin-bottom: 1rem;
          border-radius: 0.75rem;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
          animation: slideIn 0.3s ease-out;
        }

        .subscription-warning.critical,
        .subscription-suggestion.critical {
          background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
          border: 1px solid #f87171;
        }

        .subscription-warning.warning,
        .subscription-suggestion.recommended {
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          border: 1px solid #f59e0b;
        }

        .subscription-warning.info,
        .subscription-suggestion.optional {
          background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
          border: 1px solid #3b82f6;
        }

        .subscription-warning-content,
        .subscription-suggestion-content {
          display: flex;
          align-items: flex-start;
          padding: 1rem;
          gap: 1rem;
        }

        .subscription-warning-icon,
        .subscription-suggestion-icon {
          flex-shrink: 0;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.125rem;
        }

        .subscription-warning.critical .subscription-warning-icon,
        .subscription-suggestion.critical .subscription-suggestion-icon {
          background: #dc2626;
          color: white;
        }

        .subscription-warning.warning .subscription-warning-icon,
        .subscription-suggestion.recommended .subscription-suggestion-icon {
          background: #d97706;
          color: white;
        }

        .subscription-warning.info .subscription-warning-icon,
        .subscription-suggestion.optional .subscription-suggestion-icon {
          background: #2563eb;
          color: white;
        }

        .subscription-warning-message,
        .subscription-suggestion-message {
          flex: 1;
          min-width: 0;
        }

        .subscription-warning-message strong,
        .subscription-suggestion-message strong {
          display: block;
          margin-bottom: 0.25rem;
          font-weight: 600;
        }

        .subscription-warning.critical .subscription-warning-message strong,
        .subscription-suggestion.critical .subscription-suggestion-message strong {
          color: #dc2626;
        }

        .subscription-warning.warning .subscription-warning-message strong,
        .subscription-suggestion.recommended .subscription-suggestion-message strong {
          color: #d97706;
        }

        .subscription-warning.info .subscription-warning-message strong,
        .subscription-suggestion.optional .subscription-suggestion-message strong {
          color: #2563eb;
        }

        .subscription-warning-message p,
        .subscription-suggestion-message p {
          margin: 0;
          font-size: 0.875rem;
          color: #374151;
          line-height: 1.4;
        }

        .subscription-suggestion-message small {
          display: block;
          margin-top: 0.25rem;
          font-size: 0.75rem;
          color: #6b7280;
        }

        .subscription-warning-actions,
        .subscription-suggestion-actions {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          flex-shrink: 0;
        }

        .subscription-btn {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          text-align: center;
          text-decoration: none;
          display: inline-block;
        }

        .subscription-btn-primary {
          background: #059669;
          color: white;
        }

        .subscription-btn-primary:hover {
          background: #047857;
        }

        .subscription-btn-secondary {
          background: #6b7280;
          color: white;
        }

        .subscription-btn-secondary:hover {
          background: #4b5563;
        }

        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @media (max-width: 768px) {
          .subscription-warning-container {
            right: 10px;
            left: 10px;
            max-width: none;
          }

          .subscription-warning-content,
          .subscription-suggestion-content {
            flex-direction: column;
            text-align: center;
          }

          .subscription-warning-actions,
          .subscription-suggestion-actions {
            flex-direction: row;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}